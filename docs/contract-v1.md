# Questkeeper agent contract, v1

Status: draft, confirmed design. The agent scaffold implements fake, read-only recap turns only; other features below are planned.

This is the contract between **Questkeeper** (campaign data, auth, front door) and the **agent service** (this repo: prompts, tools, Anthropic loop, budget).

## Principles

- Questkeeper is the source of truth. The agent is stateless and stores no campaign data.
- The agent only sees what Questkeeper hands it. Player turns get player-safe context only.
- Every write goes through Questkeeper's domain actions, so validation and cascades still apply.
- Auth uses short-lived tokens scoped to one campaign and one turn.
- Narrative-first rules. Uncertain moments are resolved by a server-side roll, and the model narrates the outcome.

## 1. Questkeeper to agent

`POST {AGENT_URL}/v1/turn` with `Authorization: Bearer <AGENT_SHARED_SECRET>`.

Request:

```json
{
  "turnId": "uuid",
  "mode": "player_action",
  "campaignId": "string",
  "characterId": "string",
  "input": "I search the cellar for the crown",
  "callbackBase": "https://questkeeper.example/api/agent/v1",
  "callbackToken": "short-lived token scoped to this campaign and turn",
  "limits": { "maxOutputTokens": 800 }
}
```

`mode` is `player_action` or `recap`.

Response `200`:

```json
{
  "turnId": "uuid",
  "narration": "You pry open a rotted trapdoor...",
  "events": [{ "kind": "roll", "detail": "Perception: success with a cost" }],
  "applied": [{ "action": "add_item", "characterId": "string", "status": "applied" }],
  "usage": { "inputTokens": 5200, "outputTokens": 410, "costUsd": 0.004 }
}
```

Errors: `{ "error": "message", "code": "budget_exceeded" | "bad_request" | "upstream_unavailable" }`.
`budget_exceeded` is shown to players as a friendly "the DM is resting" message.

Turns are synchronous. Streaming the narration over SSE is a later, additive change.

## 2. Agent to Questkeeper

All calls go to `callbackBase` with `Authorization: Bearer <callbackToken>`.

| Endpoint | Purpose |
|---|---|
| `GET /context/player` | Player-safe context: scene, the acting character's sheet, known NPCs and quests, recent events |
| `GET /context/dm` | Full context including secrets. Allowed only for `recap` and DM-run turns |
| `POST /events` | Append to the session log: `{ kind, text, visibility: "table" or "dm" }` |
| `POST /changes` | Apply or propose a bounded change (below) |
| `POST /roll` | Server-side dice, so results are logged and cannot be invented |

### Changes

`POST /changes` takes `{ id, action, ...fields }`. `id` is a request id chosen by the agent; the server prefixes it with the turn id, so retries are idempotent. A closed set of actions, each validated by the existing domain actions:

| action | fields |
|---|---|
| `add_item` | `itemId`, `name`, `quantity`, `notes?` (upsert by `itemId`) |
| `remove_item` | `itemId` |
| `set_item_quantity` | `itemId`, `quantity` |
| `set_quest_status` | `questId`, `status` |
| `set_npc_disposition` | `npcId`, `disposition` |
| `reveal` | `type` (`npc` or `quest`), `targetId` |
| `add_session_note` | `sessionId`, `text` |

Item actions always target the token's character. The response is `{ id, action, status, reason? }` where `status` is `applied`, `pending_approval` (held for DM review) or `rejected` (with a reason; the HTTP status is still 200).
Auto-apply is the default. `remove_item` and ending a quest (`completed` or `failed`) are always `pending_approval`.
Applied changes are logged: item changes as `table` events, everything else as `dm` events, so unrevealed records are not given away.

Events and roll ids are also prefixed with the turn id. `POST /roll` takes `{ id, dice, reason? }` (for example `2d6+1`), rolls on the server and logs a `table` event. Repeating the same `id` returns `{ repeated: true, text }` instead of rolling again.

## 3. Data additions in Questkeeper

- `knownToPlayers: boolean` and `secret?: string` on quests and NPCs.
- A per-session `events` log: `{ id, at, kind, text, visibility, source: "player" | "agent" | "dm" }`.
- A pending-changes queue with approve and reject.

## 4. Security

- Callback tokens expire in minutes, are bound to one campaign and turn, and cannot read other characters' private data. A player turn can write only to its own `characterId`.
- `AGENT_SHARED_SECRET` authenticates Questkeeper to the agent. The Anthropic API key lives only in the agent service.
- `input`, player notes and inventory text are untrusted data. Tools enforce limits regardless of what the model says.
- `turnId` is an idempotency key: a retried turn must not apply its changes twice.

## 5. Budget and limits

- Questkeeper: the existing per-IP limiter on `/api/play`, plus a per-link daily turn quota.
- Agent: a global monthly spend cap, after which it answers `budget_exceeded`.
- Both: input length caps and `maxOutputTokens`.

## 6. Versioning and discovery

- Everything is under `/v1`. Within a version, changes are additive only.
- `GET /v1/health` and `GET /v1/capabilities` (supported modes and change kinds) let Questkeeper degrade gracefully.

## 7. Build order

1. Questkeeper: `knownToPlayers`, the event log and the callback token mechanism.
2. Agent repo: scaffold with a fake provider and a typed Questkeeper client, then the Anthropic provider and the `recap` mode.
3. Connect them with a read-only "summarize this session" flow before any writes.
4. `player_action` narration with `roll`, then tool-driven changes with the event log and undo.
5. Shared scene with live updates, then DM autonomy.
