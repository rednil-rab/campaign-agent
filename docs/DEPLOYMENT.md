# Deployment Guide

This guide covers deployment scenarios for the Agent Chat Service.

## Local Development with Docker Compose

Quickly spin up the full stack locally without manual MongoDB setup.

```bash
# Start all services (MongoDB, backend, frontend)
docker-compose up

# Services available at:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3001
# - MongoDB: localhost:27017
```

**Notes:**
- Backend rebuilds on code changes (volume mounted `src/`)
- Frontend rebuilds on code changes (volume mounted `src/`)
- MongoDB persists data in a named volume

**Stopping:**
```bash
docker-compose down

# Remove data volume
docker-compose down -v
```

## Production Deployment (Render)

Render provides a managed platform with automatic deployments, database hosting, and built-in monitoring.

### Initial Setup

1. **GitHub Integration:**
   - Authorize Render with GitHub
   - Connect the `campaign-agent` repository
   - Create a "Web Service" from the Render dashboard

2. **Environment Variables** (Render Dashboard > Environment):
   ```
   JWT_SECRET=<32+ character random string>
   MONGODB_URI=<Render Database connection string>
   OPENAI_API_KEY=<Your OpenAI API key>
   QUESTKEEPER_BASE=<Questkeeper API URL>
   NODE_ENV=production
   WEB_DIR=web/dist
   ```

3. **Build & Deploy Settings:**
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Standard (or higher for production traffic)

4. **Database:**
   - Use Render's PostgreSQL/MongoDB or MongoDB Atlas
   - Ensure connection string is in `MONGODB_URI`

### Auto-Deploy

After setup, Render automatically:
- Rebuilds and deploys when you push to `main`
- Runs your build command
- Starts the service with your start command
- Provides a public URL

### Monitoring

- **Logs:** Render Dashboard > Logs tab shows real-time output
- **Metrics:** CPU, memory, restart count available on service page
- **Alerts:** Configure email/Slack alerts for crashes, build failures

### Manual Deployment (Dockerfile)

If using a different platform (AWS, DigitalOcean, Fly, etc.):

```bash
# Build the image
docker build -t questkeeper-agent:latest .

# Push to registry (e.g., Docker Hub, ECR, etc.)
docker tag questkeeper-agent:latest <registry>/questkeeper-agent:latest
docker push <registry>/questkeeper-agent:latest

# Run container
docker run \
  -e JWT_SECRET=<secret> \
  -e MONGODB_URI=<uri> \
  -e OPENAI_API_KEY=<key> \
  -e QUESTKEEPER_BASE=<base> \
  -p 3000:3000 \
  <registry>/questkeeper-agent:latest
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes | — | 32+ char secret for session signing |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for agent calls |
| `QUESTKEEPER_BASE` | Yes | — | Questkeeper API base URL |
| `PORT` | No | 3000 | Server port |
| `MONGODB_DB` | No | questkeeper-agent | Database name |
| `NODE_ENV` | No | development | Set to `production` for deployment |
| `WEB_DIR` | No | web/dist | Path to built frontend (production only) |

## Health Checks

The service exposes a health endpoint for load balancers and orchestrators:

```bash
curl http://localhost:3000/api/health
# Response: { "data": "Agent Chat Service" }
```

Configure your platform to check this endpoint periodically (e.g., every 30 seconds).

## Logs & Debugging

### Local Development
```bash
# Start with verbose logging
NODE_DEBUG=* npm run dev -w @questkeeper-agent/server

# Check specific logs
npm run dev -w @questkeeper-agent/server 2>&1 | grep "error"
```

### Production (Render)
- View logs in Render Dashboard > Logs tab
- Logs are retained for 30 days
- Export logs to external service for longer retention

**Common issues:**
- **502 Bad Gateway:** Backend not responding; check logs, health endpoint
- **Connection refused (MongoDB):** Verify `MONGODB_URI`, database is running
- **401 Unauthorized:** Check `JWT_SECRET` matches in all environments
- **OpenAI errors:** Verify API key is valid, account has credits

## Scaling

### Horizontal Scaling (Render Pro/Enterprise)
- Render can spin up multiple instances behind a load balancer
- Requires stateless design (all state in MongoDB) ✓
- WebSockets not currently used (polling-based)

### Vertical Scaling
- Upgrade Render plan to get more CPU/memory per instance
- Monitor resource usage in Render Dashboard

### Database Scaling
- MongoDB Atlas: Use auto-scaling collections or upgrade cluster tier
- Render Database: Upgrade plan for more connections/storage

## Backup & Recovery

### MongoDB Backups

**MongoDB Atlas:**
- Automatic daily backups (included)
- Configure backup retention in Atlas Dashboard
- Restore to point-in-time via UI

**Local Render Database:**
- Use Render's backup feature (Render Dashboard > Backups)
- Manual backup: `mongodump` to local/S3

### Disaster Recovery Plan

1. **Data Loss:** Restore from latest backup (1-24 hours back)
2. **Service Down:** Render auto-restarts; check logs, redeploy if needed
3. **Credentials Leaked:** Rotate environment variables immediately, update Questkeeper/OpenAI API keys
4. **DDoS:** Render provides basic protection; contact support for advanced mitigation

## Monitoring & Alerts

### Key Metrics
- **Response Time:** Target <500ms for most requests
- **Error Rate:** Keep <1% (HTTP 5xx / total requests)
- **Availability:** Target 99.9% uptime
- **Database Connections:** Monitor for exhaustion

### Alerting (Render)
1. Dashboard > Service > Alerts
2. Create alerts for:
   - Service crashed/restarted
   - Build failed
   - High memory usage
   - Persistent HTTP errors

### External Monitoring (Optional)
- Integrate with Datadog, New Relic, Sentry, etc.
- Add monitoring middleware: `morgan`, `express-async-errors`

## Rollback Procedures

### Render Auto-Rollback
- If a build fails, Render keeps the previous version running
- Manual rollback: Dashboard > Deploys > Redeploy previous version

### Database Rollback
- Requires pre-deployment snapshots (if snapshot-based backup enabled)
- Or restore from timestamped backup (MongoDB Atlas, Render backups)

## Cost Optimization

- **Render:** Free tier (limited), $12-25/mo for production
- **MongoDB:** Free Atlas cluster (500 MB), ~$10/mo for production
- **OpenAI:** Pay-as-you-go; monitor usage, consider rate limiting
- **Questkeeper API:** Determine pricing with integration team

## Security Checklist

- [ ] Environment variables never committed to git
- [ ] `JWT_SECRET` is 32+ random characters
- [ ] HTTPS enforced (Render default)
- [ ] MongoDB username/password in connection string
- [ ] OpenAI API key rotated regularly
- [ ] Render firewall rules configured (if applicable)
- [ ] Rate limiting enabled (future enhancement)
- [ ] CORS properly scoped (not `*` in production)

## Post-Deployment Testing

After deploying, verify:

```bash
# Health check
curl https://<your-domain>/api/health

# Frontend loads
curl https://<your-domain>/ | grep "<!DOCTYPE"

# Backend reachable from frontend
# (Open browser, check Network tab in Dev Tools)

# Database connection works
# (Send a message via chat; should persist)
```

## Support & Troubleshooting

- **Render Docs:** https://render.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Express Docs:** https://expressjs.com
- **React Docs:** https://react.dev
- **OpenAI Docs:** https://platform.openai.com/docs
