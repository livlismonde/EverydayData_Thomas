<script>
  import { csvParse } from "d3-dsv";
  export let name;

  let coloursExpanded = false;
  let priceRangeExpanded = false;

  let colourFilter = null;
  let priceFilter = null;
  let sortKey = "ranking";
  let sortOrder = "ascending";

  let items = [];
  $: filteredItems = items
    .filter((item) => !colourFilter || item.colour === colourFilter)
    .filter((item) => !priceFilter || item.price <= priceFilter)
    .sort((itemA, itemB) => {
      if (sortOrder === "descending") {
        [itemB, itemA] = [itemA, itemB];
      }

      if (sortKey === "object" || sortKey === "description") {
        return itemA[sortKey].localeCompare(itemB[sortKey]);
      } else if (sortKey === "area") {
        return (
          parseInt(itemA.width) * parseInt(itemA.height) -
          parseInt(itemB.width) * parseInt(itemB.height)
        );
      } else {
        return itemA[sortKey] - itemB[sortKey];
      }
    });

  let activeItem = null;

  $: {
    activeItem = filteredItems[0];
  }

  async function loadSpreadsheet() {
    const res = await fetch(`/data/${name}.csv`);
    const text = await res.text();
    items = csvParse(text);
    // items.forEach((item) => (item.price = parseFloat(item.price)));
    console.log(items);
    activeItem = items[0];
  }

  function makeActive(item) {
    activeItem = item;
    // console.log(e);
  }

  function toggleColours() {
    coloursExpanded = !coloursExpanded;
  }

  function togglePriceRange() {
    priceRangeExpanded = !priceRangeExpanded;
  }

  function filterByColour(colour) {
    if (colourFilter === colour) {
      colourFilter = null;
    } else {
      colourFilter = colour;
    }
    activeItem = null;
  }

  function filterByPrice(price) {
    if (priceFilter === price) {
      priceFilter = null;
    } else {
      priceFilter = price;
    }
    activeItem = null;
  }

  function sortBy(key) {
    if (sortKey === key) {
      // Change sort order
      if (sortOrder === "ascending") {
        sortOrder = "descending";
      } else {
        sortOrder = "ascending";
      }
    } else {
      sortOrder = "ascending";
      sortKey = key;
    }
  }

  loadSpreadsheet();
</script>

<div class="header">
  <a href="/thomas-spreadsheet" class="header-button">Everyday Data</a>
  <a href="/index" class="header-button">Thomas Boni - Lier</a>
</div>

<div class="side-by-side" width="100%">
  <table>
    <tr
      ><th on:click={() => sortBy("ranking")}>nr</th>
      <th on:click={() => sortBy("object")}>object</th>
      <th on:click={() => sortBy("description")}>description</th>
      <th on:click={() => sortBy("area")}>height</th>
      <th on:click={() => sortBy("area")}>x</th>
      <th on:click={() => sortBy("area")}>width</th>
      <th on:click={() => sortBy("price")}>price</th>
    </tr>
    {#each filteredItems as item}
      <tr
        class={item === activeItem ? "active" : ""}
        on:click={makeActive(item)}
      >
        <td>{item.ranking}</td>
        <td>{item.object}</td>
        <td>{item.description}</td>
        <td>{item.width}</td>
        <td>{item.x}</td>
        <td>{item.height}</td>
        <td> € {item.price}</td>
      </tr>
    {:else}
      <tr><td colspan="7">No items found</td></tr>
    {/each}
  </table>
  <div class="sticky">
    {#if activeItem}
      <img src="/image/{activeItem.image}" alt="" />
    {:else}
      <img src="/image/empty.jpg" alt="" />
    {/if}
    <div class="filters">
      <p>filter</p>
      <button on:click={toggleColours}
        >colours {coloursExpanded ? "-" : "+"}</button
      >
      {#if coloursExpanded}
        <div class="colours">
          <button
            on:click={() => filterByColour("black")}
            class:selected={colourFilter === "black"}>black</button
          >
          <button
            on:click={() => filterByColour("blue")}
            class:selected={colourFilter === "blue"}>blue</button
          >
          <button
            on:click={() => filterByColour("gold")}
            class:selected={colourFilter === "gold"}>gold</button
          >
          <button
            on:click={() => filterByColour("green")}
            class:selected={colourFilter === "green"}>green</button
          >
          <button
            on:click={() => filterByColour("grey")}
            class:selected={colourFilter === "grey"}>grey</button
          >
          <button
            on:click={() => filterByColour("multi")}
            class:selected={colourFilter === "multi"}>multi</button
          >
          <button
            on:click={() => filterByColour("orange")}
            class:selected={colourFilter === "orange"}>orange</button
          >
          <button
            on:click={() => filterByColour("pink")}
            class:selected={colourFilter === "pink"}>pink</button
          >
          <button
            on:click={() => filterByColour("red")}
            class:selected={colourFilter === "red"}>red</button
          >
          <button
            on:click={() => filterByColour("silver")}
            class:selected={colourFilter === "silver"}>silver</button
          >
          <button
            on:click={() => filterByColour("white")}
            class:selected={colourFilter === "white"}>white</button
          >
          <button
            on:click={() => filterByColour("yellow")}
            class:selected={colourFilter === "yellow"}>yellow</button
          >
        </div>
      {/if}
      <button on:click={togglePriceRange}
        >price range {priceRangeExpanded ? "-" : "+"}</button
      >
      {#if priceRangeExpanded}
        <div class="price-range">
          <button
            on:click={() => filterByPrice(10)}
            class:selected={priceFilter === 10}>up to 10€</button
          >

          <button
            on:click={() => filterByPrice(50)}
            class:selected={priceFilter === 50}>up to 50€</button
          >

          <button
            on:click={() => filterByPrice(100)}
            class:selected={priceFilter === 100}>up to 100€</button
          >

          <button
            on:click={() => filterByPrice(500)}
            class:selected={priceFilter === 500}>up to 500€</button
          >

          <button
            on:click={() => filterByPrice(2500)}
            class:selected={priceFilter === 2500}>up to 2500€</button
          >
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  table {
    border-collapse: collapse;
    border: none;
    width: 100%;
    margin-top: 35px;
    margin-left: 10px;
  }
  th,
  td {
    border-style: hidden;
    padding: 2px;
    padding-right: 10px;
    cursor: pointer;
  }
  th {
    font: inherit;
    padding-bottom: 5px;
    position: sticky;
    top: 30px;
    background-color: white;
  }

  .active {
    background-color: black;
    color: white;
  }

  .side-by-side {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    gap: 1rem;
    padding-left: 8px;
    padding-right: 8px;
  }

  img {
    max-width: 400px;
    height: auto;
    padding-left: 20px;
    margin-right: 10px;
    margin-top: 30px;
  }
  .sticky {
    position: sticky;
    display: flex;
    flex-direction: column;
    text-align: right;
    top: 30px;
    right: 10px;
  }

  .filters {
    display: flex;
    flex-direction: column;
    text-align: right;
    margin-right: 10px;
  }

  .filters button {
    border: none;
    font: inherit;
    color: inherit;
    background-color: transparent;
    text-align: right;
    padding: 1px;
  }

  .colours {
    display: flex;
    flex-direction: column;
  }
  .price-range {
    display: flex;
    flex-direction: column;
  }

  .selected {
    text-decoration: underline;
  }

  div.header {
    display: flex;
    justify-content: space-between;
    position: fixed;
    top: 0px;
    width: 100%;
    background: white;
  }

  .header-button {
    color: rgb(0, 0, 0);
    text-align: left;
    text-decoration: none;
    font-size: 12px;
    font-weight: light;
    font-family: "Roboto Mono", sans-serif;
    z-index: 1999;
    padding-top: 12px;
    padding-left: 20px;
    padding-right: 20px;
    padding-bottom: 10px;
  }
</style>
