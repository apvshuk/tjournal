# UI configs
SIDEBAR_OPTIONS = [
    {
        "label": "Tape",
        "url": "",
        "icon": "<i class='fas fa-fire'></i>"
    },
    {
        "label": "Messages",
        "url": "",
        "icon": "<i class='far fa-comment-alt'></i>"
    },
    {
        "label": "TJ rating",
        "url": "",
        "icon": "<i class='fas fa-star-half-alt'></i>"
    },
    {
        "label": "Subscriptions",
        "url": "",
        "icon": "<i class='fas fa-th'></i>"
    }
]


COMMENT_LOAD_LIMIT = 20
POST_LOAD_LIMIT = 8


KARMA_TO_DOWNVOTE = 5
KARMA_TO_CREATE_COMMUNITY = 1000


# ribbons
my_feed_popular = 'My Feed - Popular'
my_feed_fresh = 'My Feed - Fresh'
entire_site_popular = 'Entire site - Popular'
entire_site_fresh = 'Entire site - Fresh'
ribbons = [my_feed_popular, my_feed_fresh, entire_site_popular, entire_site_fresh]


# Profile page tabs
visitor_tabs = [
    {
        'label': 'Articles',
        'href': '',
    },
    {
        'label': 'Comments',
        'href': 'comments/',
    },
]
owner_tabs = [
    {
        'label': 'Bookmarks',
        'href': 'bookmarks/',
    },
    {
        'label': 'Evaluations',
        'href': 'evals/',
    },
    {
        'label': 'Drafts',
        'href': 'drafts/',
    },
    {
        'label': 'Notifications',
        'href': 'donates/',
    },
    {
        'label': 'Donates',
        'href': 'donates/',
    },
]
end_tabs = [
    {
        'label': 'More Details',
        'href': 'details/',
    },
]