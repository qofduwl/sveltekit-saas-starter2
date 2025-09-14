<script>
  function sayHello() {
    alert('Hello!');
  }
</script>

<style>
  /* Svelte scopes styles by default, so global selectors are OK for this demo */
  body {
    font-family: Arial, sans-serif;
    margin: 2rem;
    background: #f9f9f9;
    color: #333;
  }
  h1 {
    color: #0066cc;
  }
  .box {
    padding: 1rem;
    margin: 1rem 0;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #fff;
  }
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: #0066cc;
    color: #fff;
    cursor: pointer;
  }
  button:hover {
    background: #004999;
  }
</style>

<div>
  <h1>Test Page</h1>
  <p>This is a very light test HTML page with some basic stuff.</p>
  <div class="box">
    <h2>A Box</h2>
    <p>Here's a simple box with styled content.</p>
  </div>
  <button on:click={sayHello}>Click Me</button>
  <ul>
    <li>Item one</li>
    <li>Item two</li>
    <li>Item three</li>
  </ul>
</div>