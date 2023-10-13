addEventListener("message", (e) => {
  if (!e.data.searchResult) return;
  const searchResult = [...e.data.searchResult].reverse();
  console.log(searchResult);
  let essentialList = [];
  for (let i = 0; i < searchResult?.length; i += 1) {
    if (i !== searchResult?.length - 1) {
      if (
        searchResult[i]?.length + 1 !== searchResult[i + 1]?.length &&
        searchResult[i]?.length !== searchResult[i + 1]?.length
      ) {
        essentialList.push(searchResult[i]);
      }
    }
  }
  postMessage({ essentialList: essentialList });
});
