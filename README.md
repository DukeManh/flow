# Flow

Flow is a static web application.

## Pull request previews

Each pull request automatically deploys a preview of the site using GitHub Pages. The workflow comments a URL in the form:

```
https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/pr-<PR number>/
```

Visit the link from the pull request comments to view a live preview of the changes.
