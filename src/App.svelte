<script>
  import Spreadsheet from "./Spreadsheet.svelte";

  let name = document.location.pathname.substring(1);
  console.log(name);
</script>

<Spreadsheet {name} />
