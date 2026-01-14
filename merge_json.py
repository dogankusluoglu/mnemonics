import json

with open('public/vehicle-overview.json', 'r', encoding='utf-8') as f:
    old = json.load(f)

with open('new_layers.json', 'r', encoding='utf-8') as f:
    new = json.load(f)

old['layersById'].update(new)

with open('public/vehicle-overview.json', 'w', encoding='utf-8') as f:
    json.dump(old, f, indent=2)
