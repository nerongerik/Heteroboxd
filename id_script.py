import json

INPUT_FILE = 'movie_ids_x_x_x.json'

def parse_movie_ids(input_file, output_file):
    try:
        id_count = 0
        with open(output_file, 'w', encoding='utf-8') as out_f:
            with open(input_file, 'r', encoding='utf-8') as in_f:
                #first, try to read as standard JSON
                try:
                    in_f.seek(0)
                    data = json.load(in_f)
                    #handle both list and dict structures
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and 'id' in item:
                                out_f.write(f"{item['id']}\n")
                                id_count += 1
                            elif isinstance(item, (int, str)):
                                out_f.write(f"{item}\n")
                                id_count += 1
                    elif isinstance(data, dict):
                        #if it's a dict with an 'ids' or 'movies' key
                        items = data.get('ids', data.get('movies', []))
                        if not items:
                            items = list(data.values())
                        for item in items:
                            if isinstance(item, dict) and 'id' in item:
                                out_f.write(f"{item['id']}\n")
                                id_count += 1
                            elif isinstance(item, (int, str)):
                                out_f.write(f"{item}\n")
                                id_count += 1            
                except json.JSONDecodeError:
                    #if standard JSON fails, try NDJSON (newline-delimited JSON)
                    print("Standard JSON failed, trying NDJSON format...")
                    in_f.seek(0)
                    for line_num, line in enumerate(in_f, 1):
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            obj = json.loads(line)
                            if isinstance(obj, dict) and 'id' in obj:
                                out_f.write(f"{obj['id']}\n")
                                id_count += 1
                            elif isinstance(obj, (int, str)):
                                out_f.write(f"{obj}\n")
                                id_count += 1
                        except json.JSONDecodeError as e:
                            print(f"Warning: Skipping invalid JSON on line {line_num}: {e}")
                            continue
        print(f"Successfully parsed {id_count} movie IDs from {input_file}")
        print(f"Output written to {output_file}")
    except FileNotFoundError:
        print(f"Error: File {input_file} not found")
    except Exception as e:
        print(f"Error: {e}")
if __name__ == "__main__":
    #default file paths
    input_file = INPUT_FILE
    output_file = "ids.txt"
    
    parse_movie_ids(input_file, output_file)