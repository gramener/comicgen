# Use slim version (based on Alpine Linux) to reduce image size
# Picking latest Node.JS version when creating this script
FROM node:18.8.0-slim

# Install production dependencies only
RUN npm install -g comicgen --omit=dev

# Expose port 3000 by default. It can be mapped, e.g. via -p 3333:3000
EXPOSE 3000

# Run comicserver
# Use CMD instead of ENTRYPOINT. It can be overridden to run /bin/bash
CMD ["npx", "comicserver"]
