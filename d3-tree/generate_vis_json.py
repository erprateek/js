import random
import string
import json

def random_name(length=5):
    """Generate a random name."""
    return ''.join(random.choices(string.ascii_uppercase, k=length))

def random_relation():
    """Pick a random relation."""
    relations = ["team", "department", "group", "unit", "division", "branch", "section", "squad"]
    return random.choice(relations)

def generate_node(parent_name="null", current_depth=0, max_depth=7):
    """Recursively generate a node with random children."""
    node_name = random_name()
    node_relation = random_relation() if parent_name != "null" else "null"

    node = {
        "name": node_name,
        "parent": parent_name,
        "relation": node_relation,
        "children": []
    }

    if current_depth < max_depth:
        num_children = random.randint(1, 3)  # 1 to 3 children
        for _ in range(num_children):
            child_node = generate_node(
                parent_name=node_name,
                current_depth=current_depth + 1,
                max_depth=max_depth
            )
            node["children"].append(child_node)

    return node

def generate_structure(num_roots=1, max_depth=7):
    """Generate the full structure with multiple root nodes."""
    structure = []
    for _ in range(num_roots):
        root = generate_node(max_depth=max_depth)
        structure.append(root)
    return structure

if __name__ == "__main__":
    # SETTINGS
    NUM_ROOTS = 2       # How many top-level parents you want
    MAX_DEPTH = 8       # How deep the tree should go (7–8 levels)

    random_structure = generate_structure(num_roots=NUM_ROOTS, max_depth=MAX_DEPTH)

    # Print nicely
    #print(json.dumps(random_structure, indent=2))
    # Save to file
    with open("src/data/sample_tree.json", "w") as f:
        json.dump(random_structure, f, indent=2)