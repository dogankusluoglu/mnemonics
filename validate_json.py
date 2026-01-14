import json

def get_word_footprint(word):
    coords = []
    for i in range(len(word['text'])):
        if word['direction'] == 'across':
            coords.append((word['start']['x'] + i, word['start']['y']))
        else:
            coords.append((word['start']['x'], word['start']['y'] + i))
    return coords

def intersects(wordA, wordB):
    fpA = set(get_word_footprint(wordA))
    fpB = set(get_word_footprint(wordB))
    return len(fpA.intersection(fpB)) > 0

with open('public/vehicle-overview.json', 'r', encoding='utf-8') as f:
    doc = json.load(f)

for layer_id, layer in doc['layersById'].items():
    print(f"Checking layer: {layer_id}")
    words = layer['words']
    if not words:
        print("  Layer is empty")
        continue
    for i in range(1, len(words)):
        if not intersects(words[i-1], words[i]):
            print(f"  ERROR: Chain broken between {words[i-1]['text']} and {words[i]['text']}")
        else:
            print(f"  OK: {words[i-1]['text']} -> {words[i]['text']}")
