# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-02

### Added
- Initial release of ZenTao Bug Fix Workflow
- Core workflow: list → fetch → analyze → report → approve → implement → test → commit
- Screenshot download support via zentao-mcp integration
- Mandatory approval gates at critical decision points
- Automatic commit message formatting with bug ID references
- Support for both screenshot-based and text-only bugs
- Comprehensive documentation:
  - Installation guide
  - Workflow details with diagrams
  - Troubleshooting guide
  - Architecture documentation
- Example walkthroughs for different bug types
- Chinese and English README

### Dependencies
- zentao-cli (official ZenTao CLI) - for querying bug data
- zentao-mcp v1.9.1+ (dyno-nexsoft) - for downloading attachments

[1.0.0]: https://github.com/<your-username>/zentao-bug-fix-workflow/releases/tag/v1.0.0
