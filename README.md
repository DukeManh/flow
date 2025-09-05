# Flow

Flow is a static web application.

The built-in music player skips sponsored segments in YouTube videos using the
public [SponsorBlock](https://sponsor.ajay.app/) API. Segments flagged as
`sponsor`, `selfpromo`, `intro`, `outro`, and other common categories are
automatically skipped at playback time.

The application also blocks many network ad requests by intercepting
`fetch` and `XMLHttpRequest` calls to common advertising domains such as
`doubleclick.net` and `googlesyndication.com`.

## Production deployment

The site is served from the `gh-pages` branch. Any push to `main` automatically deploys the latest files to the root of the Pages site.

## Pull request previews

Each pull request automatically deploys a preview of the site using GitHub Pages. The workflow comments a URL in the form:

```
https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/preview-pr/pr-<PR number>/
```

Visit the link from the pull request comments to view a live preview of the changes.
