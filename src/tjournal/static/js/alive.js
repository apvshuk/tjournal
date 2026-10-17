let aliveSocket;
let newComment_count = [];
function connect() {
    aliveSocket = new WebSocket('ws://'
        + window.location.host
        + '/ws/alive/');


    aliveSocket.onopen = (e) => {
        console.log('Live is Alive');
    }

    aliveSocket.onmessage = (e) => {
        let data = $.parseJSON(e.data);
        if (data.type === 'vote') {
            let className = `.${data.postPk}-votecount`;
            $(className).text(data.voteCount);
            if (data.ourPk === $('#our_pk').val()) {
                if (data.voteType === 'downvote') {
                    $(`.${data.postPk}-upvotebtn`).parent().find('.upvoteBtn').addClass('text-primary');
                    $(`.${data.postPk}-downvotebtn`).parent().find('.downvoteBtn').removeClass('text-primary');
                } else if (data.voteType === 'upvote') {
                    $(`.${data.postPk}-upvotebtn`).parent().find('.upvoteBtn').removeClass('text-primary');
                    $(`.${data.postPk}-downvotebtn`).parent().find('.downvoteBtn').addClass('text-primary');
                } else {
                    $(`.${data.postPk}-upvotebtn`).parent().find('.upvoteBtn').removeClass('text-primary');
                    $(`.${data.postPk}-downvotebtn`).parent().find('.downvoteBtn').removeClass('text-primary');
                }
            }
        } else if (data.type === 'bookmark') {
            let className = `.bookmarkBtn-${data.postPk}`;
            $(className).parent().find('span.bookmark_count').text(data.bookmarkCount);
            if (data.ourPk === $('#our_pk').val()) {
                if (data.bookmarkType === 'bookmark') {
                    $(className).addClass('fw-bold');
                } else {
                    $(className).removeClass('fw-bold');
                }
            }
        } else if (data.type === 'commentvote') {
            let className = `.${data.commentPk}-commentvotecount`;
            $(className).text(data.voteCount);
            if (data.voteCount < 0) {
                $(className).css({
                    backgroundColor: '#fff1f1',
                    color: '#cd1986',
                });
            } else if (data.voteCount > 0) {
                $(className).css({
                    backgroundColor: '#eefbf3',
                    color: '#2ea83a',
                });
            } else {
                $(className).css({
                    backgroundColor: '#ebebeb',
                    color: '#000',
                });
            }
            if (data.ourPk === $('#our_pk').val()) {
                $(`.comment-${data.commentPk}-upvote`).removeClass('unactioned');
                $(`.comment-${data.commentPk}-downvote`).removeClass('unactioned');
                if (data.voteType == 'downvote') {
                    $(`.comment-${data.commentPk}-downvote`).addClass('text-primary');
                    $(`.comment-${data.commentPk}-upvote`).removeClass('text-primary');
                    $(`.comment-${data.commentPk}-upvote`).removeClass('unactioned');
                } else if (data.voteType == 'upvote') {
                    $(`.comment-${data.commentPk}-upvote`).addClass('text-primary');
                    $(`.comment-${data.commentPk}-downvote`).removeClass('text-primary');
                } else {
                    $(`.comment-${data.commentPk}-upvote`).removeClass('text-primary');
                    $(`.comment-${data.commentPk}-downvote`).removeClass('text-primary');

                    $(`.comment-${data.commentPk}-upvote`).addClass('unactioned');
                    $(`.comment-${data.commentPk}-downvote`).addClass('unactioned');
                }
            }
        } else if (data.type === 'commentbookmark') {
            let className = `.bookmark-comment-${data.commentPk}`;
            if (data.ourPk === $('#our_pk').val()) {
                if (data.bookmarkType === 'bookmark') {
                    $(className).addClass('fw-bold');
                } else {
                    $(className).removeClass('fw-bold');
                }
            }
        } else if (data.type === 'newcomment' && data.csrf !== $('input[name=csrfmiddlewaretoken]').val()) {
            let new_comment = $.parseJSON(data.comment);
            let comment = $.parseJSON(new_comment.comment);
            let user = $.parseJSON(new_comment.user);
            let profile = $.parseJSON(new_comment.profile);
            renderComment(comment, user, profile, [0], (markup, container) => {
                container.prepend(markup);
                // render replies
                for (let i of unrenderedReplies.reverse()) {
                    if ($(`.${i[0]} .replies`)[0] === undefined) {
                        $(`.${i[0]}`).append(`
                                <div class="replies d-flex mt-3">
                                    <div class="collapser">
                                        <div class="collapser-fluid"></div>
                                    </div>
                                    <div class="reply-content"></div>
                                    <button class="uncollapser link-blue n-border-outline d-none">Show replies</button>
                                </div>
                            `);
                    }
                    $(`.${i[0]} .replies .reply-content`).append(i[1]);
                }

                received += 1;
                unrenderedReplies = [];
                newComment_count.push(`.comment-tree-${data.commentPk}`);
                $('.newCommentAlert').removeClass('d-none');
                $('.newCommentAlertNumber').text(newComment_count.length <= 9 ? newComment_count.length : '9+');
            });
            $(`.comment_count_${new_comment.postPk}`).text(new_comment.all_count);
        }
    }

    aliveSocket.onclose = (e) => {
        console.error('Live is not alive');
        console.log('Reconnecting...');
        // reconnect
        connect();
    }
}


$(document).on('click', '.newCommentAlert', (e) => {
    $(newComment_count[0])[0].scrollIntoView();
    $(newComment_count[0]).fadeOut().fadeIn().fadeOut().fadeIn().fadeOut().fadeIn();
    newComment_count.shift();
    if (newComment_count.length == 0) {
        $('.newCommentAlert').addClass('d-none');
    }
    $('.newCommentAlertNumber').text(newComment_count.length <= 9 ? newComment_count.length : '9+');
});


$(document).ready(connect);