# Flow

Flow is a static web application.

## Production deployment

The site is served from the `gh-pages` branch. Any push to `main` automatically deploys the latest files to the root of the Pages site.
Deployments keep the existing `preview-pr` folders so pull request previews remain available.

## Pull request previews

Each pull request automatically deploys a preview of the site using GitHub Pages. The workflow comments a URL in the form:

```
https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/preview-pr/pr-<PR number>/
```

Visit the link from the pull request comments to view a live preview of the changes.

The preview workflow runs on `pull_request_target` so that deployments work for contributions from forks.
