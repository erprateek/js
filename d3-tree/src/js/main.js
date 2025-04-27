// Set up SVG dimensions and zoom behavior
const width = 1200;
const height = 800;
const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(d3.zoom().on("zoom", function (event) {
    g.attr("transform", event.transform)
  }))
  .append("g")
  .attr("transform", "translate(100,100)");

const g = svg.append("g");

// Define a tree layout
const treeLayout = d3.tree()
  .size([height - 200, width - 300]); // width and height reversed for horizontal tree

// Load data
d3.json("src/data/sample_tree.json").then(function(data) {
  const root = d3.hierarchy(data);

  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse all children initially
  if (root.children) {
    root.children.forEach(collapse);
  }
  let i = 0;
  update(root);

  function collapse(d) {
    if(d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function update(source) {
    const treeData = treeLayout(root);

    const nodes = treeData.descendants();
    const links = treeData.links();

    nodes.forEach(d => {
      d.y = d.depth * 180; // Spread horizontally
    });

    // Nodes section
    const node = g.selectAll('g.node')
      .data(nodes, d => d.id || (d.id = ++i));

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${source.y0},${source.x0})`)
      .on('click', click)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);

    // Different shapes for leaf nodes vs inner nodes
    nodeEnter.append(d => {
      if (!d._children && !d.children) {
        return document.createElementNS(d3.namespaces.svg, 'path');
      } else {
        return document.createElementNS(d3.namespaces.svg, 'circle');
      }
    })
    .attr('r', 8)
    .attr('d', d => leafShapePath(8))
    .style('fill', d => colorByDepth(d.depth));

    nodeEnter.append('text')
      .attr('dy', 3)
      .attr('x', d => d.children || d._children ? -15 : 15)
      .style('text-anchor', d => d.children || d._children ? 'end' : 'start')
      .text(d => d.data.name);

    // Merge and position
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
      .duration(300)
      .attr('transform', d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle')
      .attr('r', 8)
      .style('fill', d => colorByDepth(d.depth));

    nodeUpdate.select('path')
      .attr('d', d => leafShapePath(8))
      .style('fill', d => colorByDepth(d.depth));

    // Remove old nodes
    const nodeExit = node.exit().transition()
      .duration(300)
      .attr('transform', d => `translate(${source.y},${source.x})`)
      .remove();

    nodeExit.select('circle')
      .attr('r', 1e-6);

    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // Links section
    const link = g.selectAll('path.link')
      .data(links, d => d.target.id);

    const linkEnter = link.enter().insert('path', "g")
      .attr('class', 'link')
      .attr('d', function(d){
        const o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      })
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
      .duration(300)
      .attr('d', d => diagonal(d.source, d.target));

    const linkExit = link.exit().transition()
      .duration(300)
      .attr('d', function(d) {
        const o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    function click(event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    function mouseover(event, d) {
      // Highlight path
      highlightPath(d);

      // Tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .html(`
          <strong>Name:</strong> ${d.data.name}<br>
          <strong>Parent:</strong> ${d.data.parent}<br>
          <strong>Relation:</strong> ${d.data.relation}<br>
          <strong>Direct Children:</strong> ${(d.children || d._children || []).length}<br>
          <strong>Levels below:</strong> ${maxDepth(d)}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 30) + 'px')
        .style('opacity', 1);
    }

    function mouseout(event, d) {
      d3.selectAll('path.link').style('stroke', '#ccc');
      d3.selectAll('g.node circle').style('stroke', 'none');
      d3.selectAll('g.node path').style('stroke', 'none');
      d3.select('div.tooltip').remove();
    }
  }

  function diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
  }

  function highlightPath(d) {
    let pathNodes = [];
    let current = d;
    while (current) {
      pathNodes.push(current);
      current = current.parent;
    }
    g.selectAll('path.link')
      .style('stroke', linkData => 
        (pathNodes.includes(linkData.target) ? 'orange' : '#ccc'))
      .style('stroke-width', linkData =>
        (pathNodes.includes(linkData.target) ? 4 : 2));
    g.selectAll('g.node circle')
      .style('stroke', nodeData =>
        (pathNodes.includes(nodeData) ? 'orange' : 'none'))
      .style('stroke-width', nodeData =>
        (pathNodes.includes(nodeData) ? 3 : 0));
    g.selectAll('g.node path')
      .style('stroke', nodeData =>
        (pathNodes.includes(nodeData) ? 'orange' : 'none'))
      .style('stroke-width', nodeData =>
        (pathNodes.includes(nodeData) ? 3 : 0));
  }

  function colorByDepth(depth) {
    const colors = d3.schemeSet3;
    return colors[depth % colors.length];
  }

  function maxDepth(d) {
    if (!d.children && !d._children) return 0;
    const children = d.children || d._children;
    return 1 + Math.max(...children.map(maxDepth));
  }

  function leafShapePath(size) {
    return `M0,${-size} Q${size},0 0,${size} Q${-size},0 0,${-size}Z`;
  }
});
