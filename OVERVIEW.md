# Admin panel to manage all of this
  - Chart of visits, page views (per day, month)
  - Number of publications, users
  - View user complaints about comments, users, and communities
  - Manage, edit, and create a user
  - Manage, edit, and create a community + customize it
  - Management of publications
  - Manage the essential functions of the site
  - Creating statistical pages

# User:
  - The administrator can ban the user for a period of time or for a lifetime and specify the reason, the user will receive a notification about this, and the profile will contain the period and reason for the ban. (Only the user and administrator can see this)
  - Authorization/Registration via email and password
  - Authorization/Registration via social networks (Vkontakte, Google, Facebook, Twitter)
  - Password recovery via email
  - When registering, the user automatically subscribes to the communities specified by the administrator
  User profile
    - Add / Remove avatar
    - Add / Remove cover art
    - Subscribe to a user
    - Write a personal message to the user
    - Add to blacklist
    - Ignore the author (Don't show this author's posts in the communities I subscribe to)
    - Registration date
    - Link to the social network profile through which the user logged in
    - Karma / user Rating based on the number of likes and dislikes
    - Recent publications page (sorted by day, popularity)
    - Recent comments page (sorted by day, popularity)
    - Drafts Page
    - Notification Page
    - Bookmark page (Posts and Comments)
  User settings in the profile
    - Change the name
    - Change the email
    - Change password
    - Disable digest
    - Disable notifications (on the site and by email)
        Responses to my comments
        Comment ratings
        Post ratings
        New comments to posts
        Mention in the comments to the posts
        Subscription notification
        New message
    - Pay for an extended account using Yandex Money (with an extended account, the user has more options)
    - Show or hide online status
    - Link or unlink a social network account
# Pages
  Main
  - Displaying popular hashtags for today
  - Display of publications that have more than 15 likes (by default, 50 on the page, then scrolling with loading)
    If the user is authorized
      (Display only those posts that have more than 15 likes, from the communities that the user is subscribed to, and posts from the user that the user is subscribed to)
  Fresh
    -Last-Seen Specify the number of new posts that appeared after the user last visited the fresh page
    - Display all recent publications
      If the user is authorized
      (Display only those posts that have more than 15 likes, from the communities that the user is subscribed to, and posts from the user that the user is subscribed to)
  Communities
    - Search live
    - List of communities that the user can subscribe to
  Community page
    - The administrator can assign community moderators, they can delete, edit, and publish posts and comments in this community.
    - The administrator can enable the community.
      (Then comments will not be visible to users without an extended account)
    - Avatar and community cover
    - Subscribe to the community
    - Report to the community
    - Block the community
    - Write to the community administrator
    - Enable or disable notifications
    - Description of community
    - Number of subscribers
    - Output of publications from this community (Sorting by date, popularity)
  Search
    - The header should have a live search with instant results when typing characters (Search by users, publication title, content, comments, hashtags)
    - Search all materials
    - Search for comments (Sort by date, revalence)
    - Search for a publication (Sort by date, revalence)
  User rating
    - Top 50 users per week, month, all time
    - Top 50 communities for the week, month, all time
    - Top 50 commentators
  Add a post
    - Plug-in editor https://codex.so/editor
    - Save to Draft
    - Publish
    - Select a community category to publish
      (If the user does not have an extended account, they can only see and publish to free communities, if they have an extended account, they can see everything.)
  Publication
    - The site administrator can pin and unpin a post at the top of the list in the community
    - The administrator can unpublish the article (it will go to the author's draft) and specify the reason why he did it, the author should receive a notification about it
    - The author cannot delete the publication after 30 days
    - Date of publication
    - The community where the publication was published
    - Number of views
    - Number of comments
    - Number of bookmarks added
    - Report a post
    - Share on social networks
    - Add to Bookmarks
    - The author can edit his publication (if 30 days have passed since the publication, it can not be edited)
    - Like and dislike publications
      (If the user is new, if his rating is below 0 or he is blocked, he can not put likes)
    Comments (Tree-Like)
      - The author and Administrator can pin or unpin their comment at the top of the list
      - Disable or Enable notifications for this publication
      - Number of comments
      - User's avatar
      - Date of publication of the comment
      - Write a comment (If 30 days have passed since the publication of the article, you can not write a comment)
      - Attach an image (file and link)
      - Attach video only by link
      - Mention of the user with the @username symbol (the User should receive a notification that he was mentioned)
      - Like and dislike comments
        (If the user is new, if his rating is below 0 or he is blocked, he can not put likes)
      - Add to Bookmarks
      - Report a comment
      - Reply to a comment with highlighting on the parent
      - Edit a comment
        (If 30 days have passed since the comment was published, you can't edit it)
# Notifications:
  - Mark everything as read
  - Mark one as read
  - Loading notifications when scrolling (in the drop-down menu in the header, by default 10)
  - Link to go to the all notifications page (by default, 50 per page)
# Live broadcast:
  - Display comments in real time from all publications (Last 20 entries with scrolling)
    (If the user is subscribed to the communities or user in which they are published)
  - Displaying the like or dislike of an article or comment
  - Display if someone responded to my post or comment
  - Display if the administrator deleted or unpublished my post or comment
    (In a word, "Live broadcast" all actions that occur on the site and relate to this user)
# Widgets:
  - Comment of the day
  - Comment of the week
  - Discussed for 1 day
  - Popular publications in 3 days
