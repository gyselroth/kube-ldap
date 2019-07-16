# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.1] - 2019-07-16
### Fixed
- For every authentication or token review request a new ldap connection is used, instead using a single connection for all requests. This resolves problems where the single connection went unresponsive (https://github.com/gyselroth/kube-ldap/issues/27).

## [2.0.0] - 2019-06-12
### Added
- Prometheus exporter on route "/metrics" (basic auth protected)

### Changed
- **BREAKING:** Extra-Attributes and groups are now no longer included in the JWT issued after user authentication. Extra-Attributes and group memberships are now resolved during the token review and are included in the token review response
- Internal: Use [ldapts](https://github.com/ldapts/ldapts) instead of [ldapjs](https://github.com/joyent/node-ldapjs) as ldap library

### Fixed
- Fix membership resolution for ldap objects without any membership

### Removed
- **BREAKING:** LDAP StartTLS is no longer supported
- **BREAKING:** LDAP reconnect logic (now there's a new connection for every request)

## [1.3.0] - 2019-01-07
### Changed
- Failed authentication sends a WWW-Authenticate header in the HTTP response
- Default loglevel is now info (was debug)
- Update node to latest 8.x LTS in docker image

### Added
- LDAP related logging
- Configuration parameter whether to use StartTLS for LDAP or not (enabled by default).

### Fixed
- Single group memberships are returned as a string (instead of an array) by LDAP in some cases and broke the membership resolution. This is now handled correctly.
- Fixed units in README for LDAP reconnect config parameters.

## [1.2.1] - 2018-07-19
### Added
- LDAP reconnect logic (with configurable parameters)

## [1.2.0] - 2018-04-20
### Added
- Configuration parameters for LDAP connection and operation timeouts.
- Configurable mapping between LDAP and kubernetes attributes.

## [1.1.0] - 2018-03-27
### Security
- TLS (HTTPS) support (enabled by default).

### Changed
- Log error if a DN is not in a canonicalizable format.

## [1.0.0] - 2018-03-27
### Added
- Initial key functionality

[Unreleased]: https://github.com/gyselroth/kube-ldap/compare/v2.0.1...master
[2.0.1]: https://github.com/gyselroth/kube-ldap/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/gyselroth/kube-ldap/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/gyselroth/kube-ldap/compare/v1.2.1...v1.3.0
[1.3.0]: https://github.com/gyselroth/kube-ldap/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/gyselroth/kube-ldap/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/gyselroth/kube-ldap/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/gyselroth/kube-ldap/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/gyselroth/kube-ldap/tree/v1.0.0
