import os
import json
import sys

def get_root():
  if '/flash' in sys.path:
    return '/flash'
  else:
    return '/'

def is_directory(path):
  return True if os.stat(path)[0] == 0x4000 else False

def get_all_files(path, array_of_files = []):
    files = os.ilistdir(path)
    for file in files:
        is_folder = file[1] == 16384
        p = path + '/' + file[0]
        array_of_files.append({
            "path": p,
            "type": "folder" if is_folder else "file"
        })
        if is_folder:
            array_of_files = get_all_files(p, array_of_files)
    return array_of_files


def iget_root():
  print(get_root(), end='')

def ilist_all(path):
    print(json.dumps(get_all_files(path)))

def delete_folder(path):
    files = get_all_files(path)
    for file in files:
        if file['type'] == 'file':
            os.remove(file['path'])
    for file in reversed(files):
        if file['type'] == 'folder':
            os.rmdir(file['path'])
    os.rmdir(path)

os.chdir(get_root())