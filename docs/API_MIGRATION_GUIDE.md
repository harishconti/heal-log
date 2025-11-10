# API Migration Guide

This document outlines the process for versioning the Clinic OS Lite API and handling breaking changes. Our goal is to provide a stable and predictable API for our users while still allowing for future improvements and innovation.

## Versioning

The API is versioned using a major/minor/patch scheme. The version is included in the API's OpenAPI specification.

*   **MAJOR** version: Incremented for incompatible API changes.
*   **MINOR** version: Incremented for adding functionality in a backward-compatible manner.
*   **PATCH** version: Incremented for backward-compatible bug fixes.

## Breaking Changes

A breaking change is any change that could cause a client's existing code to fail. This includes:

*   Removing an endpoint.
*   Removing a field from an endpoint's response.
*   Adding a new required field to an endpoint's request body.
*   Changing the type of a field.
*   Changing the meaning of an error code.

## Deprecation Policy

When we need to make a breaking change, we will follow this deprecation policy:

1.  **Mark as Deprecated:** The old endpoint or field will be marked as deprecated in the OpenAPI specification and the `API_DOCUMENTATION.md`. We will also add a `Warning` header to the response of deprecated endpoints.
2.  **Announce Deprecation:** We will announce the deprecation in our developer changelog and on our developer blog.
3.  **Deprecation Period:** The deprecated endpoint or field will remain available for at least **6 months**.
4.  **Removal:** After the deprecation period, the old endpoint or field will be removed from the API.

## How to Stay Informed

We encourage all developers to subscribe to our developer changelog to stay informed about upcoming changes to the API.
