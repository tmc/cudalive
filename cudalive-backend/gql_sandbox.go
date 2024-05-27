package main

import (
	"net/http"
)

func renderApolloSandbox(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(`<html>
<head>
<style>
body { margin: 0; padding: 0; }
</style>
<body><div style="width: 100%; height: 100%;" id='embedded-sandbox'></div>
<script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script> 
<script>
  new window.EmbeddedSandbox({
    target: '#embedded-sandbox',
    initialEndpoint: 'http://localhost:8080/graphql',
  });
</script>
</body></html>
  `))
}
