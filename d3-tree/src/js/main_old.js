// create a {name: node} map
var dataMap = data.reduce(function(map, node) {
    map[node.name] = node;
    return map;
}, {});

var tree = [];
data.forEach(function(node) {
    // find parent
    var parent = dataMap[node.parent];
    if (parent) {
        // create child array if it doesn't exist
        (parent.children || (parent.children = []))
            // add node to parent's child array
            .push(node);
    } else {
        // parent is null or missing
        tree.push(node);
    }
});