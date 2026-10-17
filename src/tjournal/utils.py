from user.models import Profile, Activity
from allauth.socialaccount.models import SocialAccount
from .settings import STATIC_URL
from datetime import date

def get_absolute_url_func(profile_pk):
    s = SocialAccount.objects.filter(user__profile__pk=profile_pk).first()
    if s != None:
        return s.get_avatar_url()

    s = Profile.objects.filter(pk=profile_pk).first().avatar
    if str(s).startswith(STATIC_URL):
        return str(s)
    return s.url


def merge_q(arr, left_index, mid_index, right_index):
    ## left and right arrays
    left_array = arr[left_index:mid_index+1]
    right_array = arr[mid_index+1:right_index+1]

    ## getting the left and right array lengths
    left_array_length = mid_index - left_index + 1
    right_array_length = right_index - mid_index

    ## indexes for merging two arrays
    i = j = 0

    ## index for array elements replacement
    k = left_index

    ## iterating over the two sub-arrays
    while i < left_array_length and j < right_array_length:

        ## comapring the elements from left and right arrays
        l = left_array[i].activity.filter(activity_type=Activity.UP_VOTE).count()
        l1 = left_array[i].activity.filter(activity_type=Activity.DOWN_VOTE).count()
        r = right_array[j].activity.filter(activity_type=Activity.UP_VOTE).count()
        r1 = right_array[j].activity.filter(activity_type=Activity.DOWN_VOTE).count()
        if l - l1 < r - r1:
            arr[k] = left_array[i]
            i += 1
        else:
            arr[k] = right_array[j]
            j += 1
        k += 1

    ## adding remaining elements from the left and right arrays
    while i < left_array_length:
        arr[k] = left_array[i]
        i += 1
        k += 1

    while j < right_array_length:
        j += 1
        k += 1

def merge_sort_q(arr, left_index, right_index):
    ## base case for recursive function
    if left_index >= right_index:
        return

    ## finding the middle index
    mid_index = (left_index + right_index) // 2

    ## recursive calls
    merge_sort_q(arr, left_index, mid_index)
    merge_sort_q(arr, mid_index + 1, right_index)

    ## merging the two sub-arrays
    merge_q(arr, left_index, mid_index, right_index)


# filter posts by popularity
def merge_p(arr, left_index, mid_index, right_index, filter_by):
    ## left and right arrays
    left_array = arr[left_index:mid_index+1]
    right_array = arr[mid_index+1:right_index+1]

    ## getting the left and right array lengths
    left_array_length = mid_index - left_index + 1
    right_array_length = right_index - mid_index

    ## indexes for merging two arrays
    i = j = 0

    ## index for array elements replacement
    k = left_index

    t = date.today()
    if filter_by == 'day':
        first_ = date(t.year, t.month, t.day)
    elif filter_by == 'week':
        if t.day - 7 < 1:
            first_ = date(t.year, t.month, 1)
        else:
            first_ = date(t.year, t.month, t.day - 7)
    elif filter_by == 'month':
        if t.day - 30 < 1:
            first_ = date(t.year, t.month, 1)
        else:
            first_ = date(t.year, t.month, t.day - 30)
    elif filter_by == 'year':
        first_ = date(t.year, 1, 1)
    else: # for all time
        first_ = None
    ## iterating over the two sub-arrays
    while i < left_array_length and j < right_array_length:
        ## comapring the elements from left and right arrays
        if first_ != None:
            if filter_by != 'day':
                l = left_array[i].activity.filter(date__gt=first_, activity_type=Activity.UP_VOTE).count()
                l1 = left_array[i].activity.filter(date__gt=first_, activity_type=Activity.DOWN_VOTE).count()
                r = right_array[j].activity.filter(date__gt=first_, activity_type=Activity.UP_VOTE).count()
                r1 = right_array[j].activity.filter(date__gt=first_, activity_type=Activity.DOWN_VOTE).count()
            else:
                l = left_array[i].activity.filter(date=first_, activity_type=Activity.UP_VOTE).count()
                l1 = left_array[i].activity.filter(date=first_, activity_type=Activity.DOWN_VOTE).count()
                r = right_array[j].activity.filter(date=first_, activity_type=Activity.UP_VOTE).count()
                r1 = right_array[j].activity.filter(date=first_, activity_type=Activity.DOWN_VOTE).count()
        else:
            l = left_array[i].activity.filter(activity_type=Activity.UP_VOTE).count()
            l1 = left_array[i].activity.filter(activity_type=Activity.DOWN_VOTE).count()
            r = right_array[j].activity.filter(activity_type=Activity.UP_VOTE).count()
            r1 = right_array[j].activity.filter(activity_type=Activity.DOWN_VOTE).count()
        if l - l1 < r - r1:
            arr[k] = left_array[i]
            i += 1
        else:
            arr[k] = right_array[j]
            j += 1
        k += 1

    ## adding remaining elements from the left and right arrays
    while i < left_array_length:
        arr[k] = left_array[i]
        i += 1
        k += 1

    while j < right_array_length:
        j += 1
        k += 1

def merge_sort_p(arr, left_index, right_index, filter_by):
    ## base case for recursive function
    if left_index >= right_index:
        return

    ## finding the middle index
    mid_index = (left_index + right_index) // 2

    ## recursive calls
    merge_sort_p(arr, left_index, mid_index, filter_by)
    merge_sort_p(arr, mid_index + 1, right_index, filter_by)

    ## merging the two sub-arrays
    merge_p(arr, left_index, mid_index, right_index, filter_by)