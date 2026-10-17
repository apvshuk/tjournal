# utility functions here

avatar_path = '/avatar/'
cover_art_path = '/banner/'

def avatar_upload(instance, filename):
    '''uploading avatar to the corresponding user's folder'''
    return f"community/{instance.name}{avatar_path}{filename}/"

def cover_art_upload(instance, filename):
    '''uploading cover art to the corresponding user's folder'''
    return f"community/{instance.name}{cover_art_path}{filename}/"
