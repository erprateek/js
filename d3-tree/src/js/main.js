// main.js
import { computeDepth } from './utils.js';

// Set dimensions for the SVG container
const width = 1200;
const height = 800;

// Create color scale for depth-based coloring
const color = d3.scaleSequential(d3.interpolateCool)
    .domain([0, 8]); // Adjust max depth if needed

// Create SVG element with zoom and pan functionality
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));

const g = svg.append("g")
    .attr("transform", "translate(100,40)");

// Tooltip for hover effects
const tooltip = d3.select("#tooltip");

// Create tree layout function
const treemap = d3.tree()
    .size([height - 80, width - 300]);

let i = 0;
let duration = 750;
let root;

// Load the tree data
d3.json("src/data/sample_tree.json").then(function(treeData) {
    root = d3.hierarchy(treeData, d => d.children);
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse nodes after the second level
    root.children.forEach(collapse);

    update(root);
});

// Function to collapse nodes
function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

// Function to expand nodes
function expand(d) {
    if (d._children) {
        d.children = d._children;
        d.children.forEach(expand);
        d._children = null;
    }
}

// Update the tree layout with transitions
function update(source) {
    const treeData = treemap(root);

    const nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

    // Normalize for fixed-depth
    nodes.forEach(d => { d.y = d.depth * 180; });

    // Nodes section
    const node = g.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('id', d => `node-${d.id}`)
        .attr('transform', d => `translate(${source.y0},${source.x0})`)
        .on('click', (event, d) => {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        })
        .on("mouseover", (event, d) => {
            const directChildren = d.children ? d.children.length : d._children ? d._children.length : 0;
            const maxDepth = computeDepth(d);

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);

            tooltip.html(
                `<strong>Name:</strong> ${d.data.name}<br>
                 <strong>Parent:</strong> ${d.parent ? d.parent.data.name : "None"}<br>
                 <strong>Direct Children:</strong> ${directChildren}<br>
                 <strong>Depth of Branch:</strong> ${maxDepth}`
            )
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");

            // Highlight path to root
            let current = d;
            while (current) {
                d3.select(`#node-${current.id}`).select("circle,path")
                  .attr("stroke", "red")
                  .attr("stroke-width", 3);
                current = current.parent;
            }
        })
        .on("mouseout", (event, d) => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            // Remove path highlight
            d3.selectAll("circle,path")
                .attr("stroke", "black")
                .attr("stroke-width", "1.5");
        });

    // Add shapes (circles for non-leaf nodes and path for leaf nodes)
    nodeEnter.append(d => {
        if (!d.children && !d._children) {
            return document.createElementNS(d3.namespaces.svg, "path");
        } else {
            return document.createElementNS(d3.namespaces.svg, "circle");
        }
    })
    .attr("d", d => !d.children && !d._children ? "M0,-5 Q5,0 0,5 Q-5,0 0,-5" : null) // Leaf path
    .attr("r", d => d.children || d._children ? 6 : null)
    .attr("fill", d => color(d.depth))
    .attr("stroke", "black")
    .attr("stroke-width", "1.5");

    // Add node labels
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -13 : 13)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name);

    // Transition nodes to new positions
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle')
        .attr('r', 1e-6);

    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // Links section (draw paths between nodes)
    const link = g.selectAll('path.link')
        .data(links, d => d.id);

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal(o, o);
        })
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2);

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d, d.parent));

    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return diagonal(o, o);
        })
        .remove();

    // Store old positions for transition
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
}
