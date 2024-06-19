import json

# Define the input and output file paths
input_file_path = 'US.txt' #NOTE: US.txt can be found at https://download.geonames.org/export/zip/
output_file_path = 'us_zip.json'

# Define the function to parse a line into a dictionary
def parse_line(line):
    fields = line.strip().split('\t')
    return {
        "CountryCode": fields[0],
        "PostalCode": fields[1],
        "City": fields[2],
        "StateCode": fields[4],
        "County": fields[5],
        "Latitude": fields[9],
        "Longitude": fields[10],
    }

data = {}

# Read the input file and parse each line
with open(input_file_path, 'r') as file:
    for line in file:
        if line.strip():  # Ignore empty lines
            parsed_line = parse_line(line)
            data[parsed_line["PostalCode"]] = parsed_line

# Write the parsed data to the output file in JSON format
with open(output_file_path, 'w') as file:
    json.dump(data, file, indent=4)

print(f"Data has been successfully parsed and written to {output_file_path}")