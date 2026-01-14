import json

def get_word_footprint(word):
    coords = []
    for i in range(len(word['text'])):
        if word['direction'] == 'across':
            coords.append({'x': word['start']['x'] + i, 'y': word['start']['y']})
        else:
            coords.append({'x': word['start']['x'], 'y': word['start']['y'] + i})
    return coords

def update_layer_cells(layer):
    cells_by_key = {}
    for word in layer['words']:
        footprint = get_word_footprint(word)
        for i, coord in enumerate(footprint):
            key = f"{coord['x']},{coord['y']}"
            char = word['text'][i]
            if key not in cells_by_key:
                cells_by_key[key] = {'coord': coord, 'char': char, 'wordIds': [word['id']]}
            else:
                cells_by_key[key]['char'] = char
                if word['id'] not in cells_by_key[key]['wordIds']:
                    cells_by_key[key]['wordIds'].append(word['id'])
    layer['cellsByKey'] = cells_by_key
    return layer

layers = {}

# layer-transmission
layers['layer-transmission'] = {
    'id': 'layer-transmission',
    'name': 'TRANSMISSION',
    'words': [
        {'id': 'clut', 'layerId': 'layer-transmission', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'CLUTCH'},
        {'id': 'torq', 'layerId': 'layer-transmission', 'start': {'x': 3, 'y': 0}, 'direction': 'down', 'text': 'TORQUE'},
        {'id': 'flui', 'layerId': 'layer-transmission', 'start': {'x': 1, 'y': 4}, 'direction': 'across', 'text': 'FLUID'},
        {'id': 'driv', 'layerId': 'layer-transmission', 'start': {'x': 5, 'y': 4}, 'direction': 'down', 'text': 'DRIVE'}
    ],
    'comment': 'Transferring power: The CLUTCH engages the engine to provide TORQUE. Transmission FLUID keeps the gears cool as they power the DRIVE shaft.',
    'commentPos': {'x': 8, 'y': 2}
}

# layer-traction
layers['layer-traction'] = {
    'id': 'layer-traction',
    'name': 'TRACTION',
    'words': [
        {'id': 'rubb', 'layerId': 'layer-traction', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'RUBBER'},
        {'id': 'trea', 'layerId': 'layer-traction', 'start': {'x': 5, 'y': -1}, 'direction': 'down', 'text': 'TREAD'},
        {'id': 'fric', 'layerId': 'layer-traction', 'start': {'x': 1, 'y': -1}, 'direction': 'across', 'text': 'FRICTION'},
        {'id': 'grip', 'layerId': 'layer-traction', 'start': {'x': 6, 'y': -1}, 'direction': 'down', 'text': 'GRIP'},
        {'id': 'pres', 'layerId': 'layer-traction', 'start': {'x': 6, 'y': 2}, 'direction': 'across', 'text': 'PRESSURE'}
    ],
    'comment': 'Where the rubber meets the road: The tire RUBBER has TREAD to create FRICTION. This provides GRIP, provided the air PRESSURE is correct.',
    'commentPos': {'x': 10, 'y': 4}
}

# layer-ignition
layers['layer-ignition'] = {
    'id': 'layer-ignition',
    'name': 'IGNITION',
    'words': [
        {'id': 'coil', 'layerId': 'layer-ignition', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'COIL'},
        {'id': 'plug', 'layerId': 'layer-ignition', 'start': {'x': 3, 'y': -1}, 'direction': 'down', 'text': 'PLUG'},
        {'id': 'gap1', 'layerId': 'layer-ignition', 'start': {'x': 1, 'y': 2}, 'direction': 'across', 'text': 'GAP'},
        {'id': 'arc1', 'layerId': 'layer-ignition', 'start': {'x': 1, 'y': 2}, 'direction': 'down', 'text': 'ARC'}
    ],
    'comment': 'The spark source: The ignition COIL sends power to the spark PLUG. The spark jumps the GAP in an electric ARC.',
    'commentPos': {'x': 5, 'y': 1}
}

# layer-electrical
layers['layer-electrical'] = {
    'id': 'layer-electrical',
    'name': 'ELECTRICAL',
    'words': [
        {'id': 'lead', 'layerId': 'layer-electrical', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'LEAD'},
        {'id': 'acid', 'layerId': 'layer-electrical', 'start': {'x': 2, 'y': 0}, 'direction': 'down', 'text': 'ACID'},
        {'id': 'cell', 'layerId': 'layer-electrical', 'start': {'x': 2, 'y': 1}, 'direction': 'across', 'text': 'CELL'}
    ],
    'comment': 'Battery internals: LEAD plates submerged in sulfuric ACID form a galvanic CELL to store energy.',
    'commentPos': {'x': 6, 'y': 1}
}

# layer-valvetrain
layers['layer-valvetrain'] = {
    'id': 'layer-valvetrain',
    'name': 'VALVETRAIN',
    'words': [
        {'id': 'cam1', 'layerId': 'layer-valvetrain', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'CAM'},
        {'id': 'lobe', 'layerId': 'layer-valvetrain', 'start': {'x': 1, 'y': -1}, 'direction': 'down', 'text': 'LOBE'},
        {'id': 'lift', 'layerId': 'layer-valvetrain', 'start': {'x': -1, 'y': 1}, 'direction': 'across', 'text': 'LIFT'},
        {'id': 'seat', 'layerId': 'layer-valvetrain', 'start': {'x': -1, 'y': 1}, 'direction': 'down', 'text': 'SEAT'}
    ],
    'comment': 'Precision timing: The CAM shaft has a LOBE that provides LIFT to open the valve before it returns to its SEAT.',
    'commentPos': {'x': 3, 'y': 3}
}

# layer-emissions
layers['layer-emissions'] = {
    'id': 'layer-emissions',
    'name': 'EMISSIONS',
    'words': [
        {'id': 'pipe', 'layerId': 'layer-emissions', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'PIPE'},
        {'id': 'muff', 'layerId': 'layer-emissions', 'start': {'x': 3, 'y': -1}, 'direction': 'down', 'text': 'MUFFLER'},
        {'id': 'flow', 'layerId': 'layer-emissions', 'start': {'x': 1, 'y': 1}, 'direction': 'across', 'text': 'FLOW'}
    ],
    'comment': 'Cleaning the air: Exhaust travels through the tail PIPE and MUFFLER to regulate gas FLOW and noise.',
    'commentPos': {'x': 6, 'y': 2}
}

# layer-combustion-chem
layers['layer-combustion-chem'] = {
    'id': 'layer-combustion-chem',
    'name': 'COMBUSTION CHEMISTRY',
    'words': [
        {'id': 'fuel', 'layerId': 'layer-combustion-chem', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'FUEL'},
        {'id': 'lean', 'layerId': 'layer-combustion-chem', 'start': {'x': 3, 'y': -1}, 'direction': 'down', 'text': 'LEAN'},
        {'id': 'atom', 'layerId': 'layer-combustion-chem', 'start': {'x': 1, 'y': 1}, 'direction': 'across', 'text': 'ATOM'}
    ],
    'comment': 'Molecular reaction: FUEL is mixed with air; if there is too much air, the mixture is LEAN. Heat breaks the ATOM bonds.',
    'commentPos': {'x': 5, 'y': 2}
}

# layer-thermodynamics
layers['layer-thermodynamics'] = {
    'id': 'layer-thermodynamics',
    'name': 'THERMODYNAMICS',
    'words': [
        {'id': 'heat', 'layerId': 'layer-thermodynamics', 'start': {'x': 0, 'y': 0}, 'direction': 'across', 'text': 'HEAT'},
        {'id': 'work', 'layerId': 'layer-thermodynamics', 'start': {'x': 3, 'y': -1}, 'direction': 'down', 'text': 'WORK'},
        {'id': 'loss', 'layerId': 'layer-thermodynamics', 'start': {'x': 1, 'y': 1}, 'direction': 'across', 'text': 'LOSS'}
    ],
    'comment': 'Energy conversion: HEAT from combustion is converted into mechanical WORK, though some is always a thermal LOSS.',
    'commentPos': {'x': 5, 'y': 2}
}

final_layers = {}
for lid, ldata in layers.items():
    final_layers[lid] = update_layer_cells(ldata)

with open('new_layers.json', 'w', encoding='utf-8') as f:
    json.dump(final_layers, f, indent=2)
