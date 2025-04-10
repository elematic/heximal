# @heximal/site

The public website for Heximal

### Deploy to Cloud Run

From the top level of the monorepo:

```sh
docker build -f packages/site/Dockerfile -t site --platform linux/amd64 .
docker tag site us-central1-docker.pkg.dev/heximal/cloud-run-images/site
docker push us-central1-docker.pkg.dev/heximal/cloud-run-images/site
gcloud run deploy site --image=us-central1-docker.pkg.dev/heximal/cloud-run-images/site
```
