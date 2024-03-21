import os
import json
os.chdir('/')
def is_directory(path):
  return True if os.stat(path)[0] == 0x4000 else False

def file_tree_generator(folder_path, depth=0):
  try:
    os.listdir(folder_path)
  except OSError as err:
      print('path not existing')
      return False
  for itm in os.ilistdir(folder_path):
    item_path = folder_path + '/' + itm[0]
    item_path = item_path.replace('//', '/')
    if is_directory(item_path):
      yield from file_tree_generator(item_path, depth=depth + 1)
    else:
      yield depth, False, item_path
  yield depth, True, folder_path

def delete_fs_item(fs_path, is_folder = False):
  print('deleting', 'folder:' if is_folder else 'file:', fs_path)
  if is_folder:
    os.rmdir(fs_path)
  else:
    os.remove(fs_path)

def delete_folder(path = '.'):
  for depth, is_folder, file_path in file_tree_generator(path):
    if file_path in ('.', os.getcwd()):
      print('cannot delete current folder')
      continue
    delete_fs_item(file_path, is_folder)

def get_file_tree(path = '.'):
  tree_list = []
  if path in ('', '.'):
    path = os.getcwd()
  for depth, is_folder, file_path in file_tree_generator(path):
    if file_path in ('.', os.getcwd()):
      continue
    file_name = file_path.split('/')[len(file_path.split('/'))-1]
    tree_list.insert(0, list((depth, file_path, file_name, 'folder' if is_folder else 'file')))
  return tree_list

def print_file_tree(path = '.'):
  print(json.dumps(get_file_tree(path)))
