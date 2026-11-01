/**
 * Swagger UI bootstrap for /docs.
 *
 * The description is fetched from this origin, and only the two methods the API
 * actually answers are offered, so "Try it out" cannot send a request that comes
 * back as an error card.
 */
window.ui = SwaggerUIBundle({
  url: '/openapi.yaml',
  dom_id: '#swagger-ui',
  deepLinking: true,
  supportedSubmitMethods: ['get', 'head'],
  presets: [SwaggerUIBundle.presets.apis],
  layout: 'BaseLayout',
  // The optional validator badge would call a third-party service.
  validatorUrl: null,
})
