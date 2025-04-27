import json
import random
import string
import os

def random_name(length=5):
    return ''.join(random.choices(string.ascii_uppercase, k=length))

def random_relation():
    relations = ["rel", "conn", "link", "assoc", "bind", "map", "relate"]
    return random.choice(relations)

def generate_flat_tree(num_root_nodes=1, max_depth=7, max_children=3):
    nodes = []
    id_counter = 0
    
    def create_node(name, parent, depth):
        nonlocal id_counter
        node = {
            "name": name,
            "parent": parent if parent else "null",
            "relation": random_relation() if parent else "null",
            "depth": depth
        }
        nodes.append(node)

    def add_children(parent_name, current_depth):
        if current_depth >= max_depth:
            return
        
        num_children = random.randint(1, max_children)
        for _ in range(num_children):
            child_name = random_name()
            create_node(child_name, parent_name, current_depth + 1)
            add_children(child_name, current_depth + 1)

    for _ in range(num_root_nodes):
        root_name = random_name()
        create_node(root_name, None, 0)
        add_children(root_name, 0)

    return nodes

if __name__ == "__main__":
    # Customize your parameters here
    output_file = os.path.join('src','data','flat_tree.json')
    num_root_nodes = 1
    max_depth = 8
    max_children = 3

    tree = generate_flat_tree(num_root_nodes=num_root_nodes, max_depth=max_depth, max_children=max_children)

    # Save to file
    with open(output_file, "w") as f:
        json.dump(tree, f, indent=4)

    print(f"Flat tree with {len(tree)} nodes written to '{output_file}'")
