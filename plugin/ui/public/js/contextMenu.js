export const setupContextMenu = (yAxisGroup, labels, removedLabels, updateGraph, updateRemovedLabelsUI) => {
  const contextMenu = d3.select("body")
    .append("div")
    .attr("class", "context-menu")
    .style("position", "absolute")
    .style("display", "none")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)");

  yAxisGroup.selectAll(".tick text")
    .on("contextmenu", function (event, label) {
      event.preventDefault();

      contextMenu
        .style("display", "block")
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`)
        .html(`<div class="menu-item" data-label="${label}">Remove from plot</div>`);

      contextMenu.select(".menu-item").on("click", function () {
        const labelToRemove = d3.select(this).attr("data-label");
        labels = labels.filter(l => l !== labelToRemove);
        removedLabels.push(labelToRemove);

        contextMenu.style("display", "none");
        updateGraph();
        updateRemovedLabelsUI();
      });
    });

  d3.select("body").on("click", () => {
    contextMenu.style("display", "none");
  });
};