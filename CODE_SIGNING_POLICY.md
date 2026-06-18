Free code signing provided by [SignPath.io](https://signpath.io/), certificate by [SignPath Foundation](https://signpath.org/)

## Signing Rules and Process
- **Committers / Reviewers:** @A-Star100
- **Approvers:** @A-Star100

To maintainers: code signs with highly trusted certs must ONLY be executed on release builds. NEVER test builds or development builds, otherwise an unsigned rebuild should be initiated.
All production releases are built in CI, and all maintainers must use secure authentication.
