# utility functions here

avatar_path = '/avatar/'
cover_art_path = '/banner/'
post_image_path = '/post/images/'
comment_image_path = '/comment/images/'

def avatar_upload(instance, filename):
    '''uploading avatar to the corresponding user's folder'''
    return f"users/{instance.user.username}{avatar_path}{filename}/"

def cover_art_upload(instance, filename):
    '''uploading cover art to the corresponding user's folder'''
    return f"users/{instance.user.username}{cover_art_path}{filename}/"

def editor_image_upload(instance, filename):
    '''uploading cover art to the corresponding user's folder'''
    return f"users/{instance.user.username}{post_image_path}{filename}/"

def comment_image_upload(instance, filename):
    '''uploading cover art to the corresponding user's folder'''
    return f"users/{instance.user.username}{comment_image_path}{filename}/"


# update karma
def update_by_one(user_profile, add=True):
    k = 1
    if add:
        user_profile.karma = float(user_profile.karma) + k
    else:
        user_profile.karma = float(user_profile.karma) - k
    user_profile.save()
def update_by_half(user_profile, add=True):
    k = 0.5
    if add:
        user_profile.karma = float(user_profile.karma) + k
    else:
        user_profile.karma = float(user_profile.karma) - k
    user_profile.save()