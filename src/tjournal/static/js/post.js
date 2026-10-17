let unrenderedReplies = [];
function renderComment(comments, usersDets, profilesDets, all_votes, func, extra_classes = '', authenticated=true, commentContainer=$('#commentsContent')) {
    let allMarkup = ``;
    let tempMarkup = ``;
    let votes;
    let time;
    let downvoteMarkup = ``;
    let upvoteMarkup = ``;
    let bookmarkMarkup = ``;
    for (let i in comments) {
        votes = all_votes[i];
        time = `${comments[i].fields.time.split(':')[0]}:${comments[i].fields.time.split(':')[1]}`;
        downvoteMarkup = `<button class="comment-${comments[i].pk}-downvote commentVoteBtn fa fa-chevron-down n-border-outline${profilesDets[i].fields.bio === false ? ' text-primary' : profilesDets[i].fields.bio === true ? ' text-black' : ' text-black unactioned'}" style="font-size: 1.1rem;" data-votetype="downvote" data-commentpk="${comments[i].pk}"></button>`;
        upvoteMarkup = `<button class="comment-${comments[i].pk}-upvote commentVoteBtn fa fa-chevron-up n-border-outline${profilesDets[i].fields.bio === true ? ' text-primary' : profilesDets[i].fields.bio === false ? ' text-black' : ' text-black unactioned'}" style="font-size: 1.1rem;" data-votetype="upvote" data-commentpk="${comments[i].pk}"></button>`;
        bookmarkMarkup = profilesDets[i].fields.karma === true ?
            `<button data-commentpk="${comments[i].pk}" style="font-size: 0.8rem;" class="fw-bold bookmark-comment-${comments[i].pk} bookmark-comment far fa-bookmark n-border-outline"></button>`
            : `<button data-commentpk="${comments[i].pk}" style="font-size: 0.8rem;" class="bookmark-comment-${comments[i].pk} bookmark-comment far fa-bookmark n-border-outline"></button>`;

        tempMarkup = `
            <div class="comment-tree comment-tree-${comments[i].pk}">
                <div class="mb-3 px-2 py-2 e_comment ${extra_classes}${comments[i].fields.reply === null && comments[i].fields.reply === 0 ? ' comment_' : ' replyComment_'}" id="comment-${comments[i].pk}"${comments[i].fields.reply !== null && comments[i].fields.reply !== 0 ? ` data-parentid='${comments[i].fields.reply}'` : ''}>
                    <div class="d-flex space-between user-select-none">
                        <a href="/u/${usersDets[i].pk}/" class="d-block d-flex">
                            <div class="my-auto">
                                <img width="35" height="35" src="${profilesDets[i].fields.avatar}" class="rounded-circle" />
                            </div>
                            <div class="mx-2 my-auto">
                                <span style="font-weight: 500;" class="commentUserNickName fs-5 d-block text-dark">${usersDets[i].fields.username}${comments[i].fields.reply !== null && comments[i].fields.reply !== 0 ? ' <i class="fas fa-reply text-secondary" style="font-size: 0.6em;"></i>' : ''}</span>
                                <span style="font-size: 0.75rem;" class="px-1 text-secondary">${convertDateRelevant(comments[i].fields.date)} @ ${time}</span>
                            </div>
                        </a>
                        <div>
                            ${authenticated === true ? downvoteMarkup : `<button class="fas fa-chevron-up n-border-outline text-black unactioned show_login_options" data-bs-toggle="modal" data-bs-target="#login_modal" style="font-size: 1.1rem;"></button>`}
                            <span style="${votes < 0 ? 'color: #cd1986;background-color: #fff1f1;' :
                            votes > 0 ? 'color: #2ea83a;background-color: #eefbf3;' : 'background-color: #ebebeb;'}"
                            class="${comments[i].pk}-commentvotecount fw-bold d-inline-block px-3 text-center" style="user-select: none;">${votes}</span>
                            ${authenticated === true ? upvoteMarkup : `<button class="fas fa-chevron-down n-border-outline text-black unactioned show_login_options" data-bs-toggle="modal" data-bs-target="#login_modal" style="font-size: 1.1rem;"></button>`}
                        </div>
                    </div>
                    <div>
                        <p>${comments[i].fields.content}</p>
                        ${comments[i].fields.image !== '' ? `<img src='/media/${comments[i].fields.image}' class="mt-2" style="max-width: 100%;width: auto;height: auto;">` : ''}
                    </div>
                    <div class="user-select-none">
                        <button style="font-size: 0.8rem;" data-reply="${comments[i].pk}" class="replyCommentBtn far fa-comment n-border-outline"></button>
                        ${authenticated === true ? bookmarkMarkup : `<button style="font-size: 0.8rem;" class="far fa-bookmark n-border-outline show_login_options" data-bs-toggle="modal" data-bs-target="#login_modal"></button>`}
                        <div class="dropdown my-auto">
                            <button style="font-size: 0.8rem;" onclick="showDropdown('comment_drop_${comments[i].pk}')" class="dropbtn fas fa-ellipsis-h n-border-outline"></button>
                            <div id="comment_drop_${comments[i].pk}" class="dropdown-content dropdown-content-left">
                                <div></div>
                                <button style="font-size: 0.8rem;" class="drop_elem w-100 d-flex n-border-outline my-auto px-3 py-2">Ignore</button>
                                <button style="font-size: 0.8rem;" class="drop_elem w-100 d-flex n-border-outline my-auto px-3 py-2">Complain</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (comments[i].fields.reply === null || comments[i].fields.reply === 0) {
            allMarkup += tempMarkup;
        } else {
            unrenderedReplies.push([`comment-tree-${comments[i].fields.reply}`, tempMarkup]);
        }
    }
    func(allMarkup, commentContainer);
}


$(document).on('click', '.voteBtn', (e) => {
    let voteType = $(e.target).data('votetype');
    let postPk = $(e.target).data('postpk');

    $.ajax({
        method: 'POST',
        url: '/vote/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            pk: postPk,
            voteType: voteType,
        },
        success: (data) => {
            e.target.disabled = false;
            showAlert(data.message);
            if (data.status) {
                let votes = data.count;
                let id_ = `#${postPk}-votecount`;
                $(id_).text(votes);

                if (data.status) {
                    if (data.voteType === 'downvote') {
                        $(`.${data.postPk}-upvotebtn`).parent().find('.upvoteBtn').addClass('text-primary');
                        $(`.${data.postPk}-downvotebtn`).parent().find('.downvoteBtn').removeClass('text-primary');
                    } else if (data.voteType === 'upvote') {
                        $(`.${data.postPk}-upvotebtn`).parent().find('.upvoteBtn').removeClass('text-primary');
                        $(`.${data.postPk}-downvotebtn`).parent().find('.downvoteBtn').addClass('text-primary');
                    }
                    aliveSocket.send(JSON.stringify({
                        'type': 'vote',
                        'postPk': postPk,
                        'ourPk': $('#our_pk').val(),
                    }));
                } else {
                    $(`.${data.postPk}-upvotebtn`).parent().find('.upvoteBtn').removeClass('text-primary');
                    $(`.${data.postPk}-downvotebtn`).parent().find('.downvoteBtn').removeClass('text-primary');
                }
            }
        },
        error: () => {
            e.target.disabled = false;
            showAlert();
        },
        beforeSend: () => {
            e.target.disabled = true;
        },
    });
});


$(document).on('click', '.bookmarkBtn', (e) => {
    let postPk = $(e.target).data('postpk');

    $.ajax({
        method: 'POST',
        url: '/bookmark/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            pk: postPk,
        },
        success: (data) => {
            $(`.bookmarkBtn-${postPk}`).attr('disabled', false);
            showAlert(data.message);
            if (data.status) {
                if (data.bookmarked) {
                    $(`.bookmarkBtn-${postPk}`).addClass('fw-bold');
                } else {
                    $(`.bookmarkBtn-${postPk}`).removeClass('fw-bold');
                }
                $(`.bookmarkBtn-${postPk}`).parent().find('.bookmark_count').text(data.count);
                aliveSocket.send(JSON.stringify({
                    'type': 'bookmark',
                    'postPk': postPk,
                    'ourPk': $('#our_pk').val(),
                }));
            }
        },
        error: () => {
            $(`.bookmarkBtn-${postPk}`).attr('disabled', false);
            showAlert();
        },
        beforeSend: () => {
            $(`.bookmarkBtn-${postPk}`).attr('disabled', true);
        },
    });
});


$(document).on('click', '.make_post_public', (e) => {
    $.ajax({
        method: 'POST',
        url: '/make_post_public/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            pk: $(e.target).data('pk'),
        },
        success: (data) => {
            if (data.status) {
                loadPage(location.href);
            } else {
                showAlert();
            }
        },
        error: () => {
            e.target.disabled = false;
            showAlert();
        },
        beforeSend: () => {
            e.target.disabled = true;
        },
    });
});


$(document).on('click', '.make_post_private', (e) => {
    $.ajax({
        method: 'POST',
        url: '/make_post_private/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            pk: $(e.target).data('pk'),
        },
        success: (data) => {
            if (data.status) {
                loadPage(location.href);
            } else {
                showAlert();
            }
        },
        error: () => {
            e.target.disabled = false;
            showAlert();
        },
        beforeSend: () => {
            e.target.disabled = true;
        },
    });
});


$(document).on('click', '.delete_post', (e) => {
    askUser("Delete Post?", "Are you sure you want to delete this post?", (status) => {
        if (status) {
            $.ajax({
                method: 'POST',
                url: `/delete-post/`,
                data: {
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                    pk: $(e.target).data('pk'),
                },
                success: (data) => {
                    if (data.status) {
                        loadPage('/', false);
                    } else {
                        showAlert();
                    }
                },
                error: () => {
                    e.target.disabled = false;
                    showAlert();
                },
                beforeSend: () => {
                    e.target.disabled = true;
                },
            });
        }
    });
});

$(document).on('click', '.anchor_post', (e) => {
    askUser("Anchor Post?", "Any post anchored earlier will be removed", (status) => {
        if (status) {
            $.ajax({
                method: 'POST',
                url: `/anchor-post/`,
                data: {
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                    pk: $(e.target).data('pk'),
                },
                success: (data) => {
                    if (data.status) {
                        loadPage(location.href, false);
                    } else {
                        showAlert();
                    }
                },
                error: () => {
                    e.target.disabled = false;
                    showAlert();
                },
                beforeSend: () => {
                    e.target.disabled = true;
                },
            });
        }
    });
});

$(document).on('click', '.unanchor_post', (e) => {
    askUser("Unanchor Post?", "Are you sure you want to unanchor this post?", (status) => {
        if (status) {
            $.ajax({
                method: 'POST',
                url: `/unanchor-post/`,
                data: {
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                    pk: $(e.target).data('pk'),
                },
                success: (data) => {
                    if (data.status) {
                        loadPage(location.href, false);
                    } else {
                        showAlert();
                    }
                },
                error: () => {
                    e.target.disabled = false;
                    showAlert();
                },
                beforeSend: () => {
                    e.target.disabled = true;
                },
            });
        }
    });
});


let links = {};
let currImage;
function validateCommentInput(returnValue = false) {
    textareaFilled = true;
    if ($('#comment_input').val().trim().length >= 10 && $('#comment_input').val().trim().length <= 1000) {
        $('#comment_submit').attr('disabled', false);
    } else {
        $('#comment_submit').attr('disabled', true);
        textareaFilled = false;
    }
    if (returnValue) {
        return textareaFilled;
    }
}
function resetComment() {
    $('#comment_form')[0].reset();
    links = {};
    currImage = undefined;
    for (const i of $('#commentPreview').children()) { $(i).html(''); }
}

let currentReply = 0;
// submit comment form
$(document).on('submit', '#comment_form', (e) => {
    e.preventDefault();
    if (!validateCommentInput(true)) { return; }
    let fd = new FormData();
    fd.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').val());
    fd.append('pk', $('#comment_submit').data('pk'));
    fd.append('content', $('#comment_input').val());
    fd.append('image', currImage);
    linksArr = [];
    for (let key in links) {
        if (links.hasOwnProperty(key)) {
            linksArr.push(links[key]);
        }
    }
    fd.append('links', linksArr);
    fd.append('reply', currentReply);
    $.ajax({
        method: 'POST',
        url: `/add-comment/`,
        enctype: 'multipart/form-data',
        data: fd,
        success: (dta) => {
            resetComment();
            let comment = $.parseJSON(dta.comment);
            let user = $.parseJSON(dta.user);
            let profile = $.parseJSON(dta.profile);
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
                unrenderedReplies = [];
                // update comment count
                $('.comment_count').text(dta.comment_count);
            }, 'popout_effect');

            received += 1;

            aliveSocket.send(JSON.stringify({
                'type': 'newcomment',
                'commentPk': comment[0].pk,
                'ourPk': $('#our_pk').val(),
                'csrf': $('input[name=csrfmiddlewaretoken]').val(),
            }));
        },
        error: () => {
            $('#comment_submit').attr('disabled', false);
            showAlert();
        },
        beforeSend: () => {
            $('#comment_submit').attr('disabled', true);
        },
        cache: false,
        contentType: false,
        processData: false,
    });
});
// image validation
$(document).on('change', '#comment_image_input', (e) => {
    let blob = URL.createObjectURL(e.target.files[0]);
    currImage = e.target.files[0];
    $('#commentPreview #commentImage').html(`
        <div class="border px-1 py-1 text-center mx-3 text-center" style="display: inline-block;width: 100px;border-radius: 6px;overflow: hidden;">
            <button type="button" id="imageRemove" class="btn-close" aria-label="Close" style="display:block;postion: relative;left: 50px;"></button>
            <img src="${blob}" style="max-width: 100%;height: auto;width: auto;border-radius: 8px;">
        </div>
    `);
});
// links validation
$(document).on('click', '#comment_link', (e) => {
    inputUser('Type a url', '', (status, value) => {
        if (status) {
            $.ajax({
                method: 'POST',
                url: '/crawl/',
                data: {
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                    link: () => {
                        return value.replace('https://', '');
                    },
                },
                success: (data) => {
                    if (data.status) {
                        let fullUrl = new URL(data.link);
                        let imageMarkup = '';
                        let descriptionMarkup = '';
                        let expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
                        let regex = new RegExp(expression);
                        if (!data.image.match(regex)) {
                            if (data.image.startsWith('//')) {
                            } else if (!(data.image.includes('http://') || data.image.includes('https://'))) {
                                if (data.image == 'favicon.ico') {
                                    imageMarkup = `<img src="http://${fullUrl.hostname}/${data.image}" style="width: 40px;height: auto;" class="d-inline-block">`;
                                } else {
                                    imageMarkup = `<img src="http://${fullUrl.hostname}${data.image}" style="width: 40px;height: auto;" class="d-inline-block">`;
                                }
                            }
                        } else {
                            imageMarkup = `<img src="${data.image}" style="width: 40px;height: auto;" class="d-inline-block">`;
                        }
                        if (data.description != '') {
                            descriptionMarkup = `<small>${data.description.slice(0, 10)}...</small>`;
                        }
                        let r = (Math.random() + 1).toString(36).substring(2);
                        links[r] = fullUrl.href;
                        $('#commentPreview #commentLink').append(`
                            <div class="border px-1 py-1 text-center mx-3 text-center" style="display: inline-block;width: 100px;border-radius: 6px;overflow: hidden;" title="${data.description}">
                                <button type="button" data-id="${r}" class="removeLink btn-close" aria-label="Close" style="display:block;postion: relative;left: 50px;"></button>
                                <a href="${fullUrl.href}" target="_blank" title="${data.description}">
                                    <div class="text-center">
                                        ${imageMarkup}
                                    </div>
                                    ${descriptionMarkup}
                                    <span class="fw-bold">${fullUrl.hostname}</span>
                                </a>
                            </div>
                        `);
                    }
                },
                error: () => { },
            });
        }
    });
});
// submit validation
$(document).on('input', '#comment_input', validateCommentInput);

$(document).on('click', '.removeLink', (e) => {
    let id = $(e.target).data('id');
    // remove from the variable to be sent to server
    delete links[id];
    // remove from the markup
    $(e.target).parent().remove();
});

$(document).on('click', '#imageRemove', (e) => {
    $('#comment_image_input').val('');
    $('#commentPreview #commentImage').html(``);
});


function fetchComment(commentContainer, pk) {
    if (commentContainer[0] != undefined && !requesting && loadMore) {
        requesting = true;
        $.ajax({
            method: 'POST',
            url: `/fetch-comment/${Number(pk)}/`,
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                received: received,
                order: order,
            },
            success: (dta) => {
                $('.comment_filter').attr('disabled', false);

                let comments = $.parseJSON(dta.comments);
                if (comments.length == 0) {
                    $('#commentLoader').remove();
                    loadMore = false;
                    return;
                }
                let usersDets = $.parseJSON(dta.user_dets);
                let profilesDets = $.parseJSON(dta.profiles_dets);
                let votes = dta.votes;

                renderComment(comments, usersDets, profilesDets, votes, (markup, container) => {
                    $('#commentLoader').remove();
                    container.append(markup);
                    requesting = false;
                    received += comments.length;

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
                    unrenderedReplies = [];
                }, '', dta.authenticated);
            },
            error: () => {
                $('.comment_filter').attr('disabled', false);

                let b = document.createElement('button');
                b.innerText = 'There was some problem. Please retry';
                b.classList = 'transp-btn n-border-outline btn-bx-s bg-white w-100';
                b.id = 'commentRetryBtn';
                b.onclick = () => {
                    requesting = false;
                    fetchComment(commentContainer, pk);
                }
                commentContainer.append(b);
                $('#commentLoader').remove();
            },
            beforeSend: () => {
                $('#commentRetryBtn').remove();
                commentContainer.append(`
                    <div class="text-center" id="commentLoader">
                        <span style="width: 40px;height: 40px;" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    </div>
                `);
            }
        }, true);
    }
}
// comment rendering
$(window).scroll(function () {
    let commentContainer = $('#commentsContent');
    let pk = commentContainer.data('postpk');
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
        fetchComment(commentContainer, pk);
    }
});

// comment voting
$(document).on('click', '.commentVoteBtn', (e) => {
    let voteType = $(e.target).data('votetype');
    let commentPk = $(e.target).data('commentpk');

    $.ajax({
        method: 'POST',
        url: '/comment-vote/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            pk: commentPk,
            voteType: voteType,
        },
        success: (data) => {
            e.target.disabled = false;
            showAlert(data.message);
            if (data.status) {
                let votes = data.count;
                let id_ = `.${commentPk}-commentvotecount`;
                $(id_).text(votes);

                if (data.voted) {
                    if (voteType == 'downvote') {
                        $(`.comment-${commentPk}-downvote`).addClass('text-primary');
                        $(`.comment-${commentPk}-upvote`).removeClass('text-primary');
                        $(`.comment-${commentPk}-upvote`).removeClass('unactioned');
                    } else if (voteType == 'upvote') {
                        $(`.comment-${commentPk}-upvote`).addClass('text-primary');
                        $(`.comment-${commentPk}-downvote`).removeClass('text-primary');
                    }
                    $(`.comment-${commentPk}-upvote`).removeClass('unactioned');
                    $(`.comment-${commentPk}-downvote`).removeClass('unactioned');
                } else {
                    $(`.comment-${commentPk}-upvote`).removeClass('text-primary');
                    $(`.comment-${commentPk}-downvote`).removeClass('text-primary');

                    $(`.comment-${commentPk}-upvote`).addClass('unactioned');
                    $(`.comment-${commentPk}-downvote`).addClass('unactioned');
                }
                if (votes < 0) {
                    $(id_).css({
                        backgroundColor: '#fff1f1',
                        color: '#cd1986',
                    });
                } else if (votes > 0) {
                    $(id_).css({
                        backgroundColor: '#eefbf3',
                        color: '#2ea83a',
                    });
                } else {
                    $(id_).css({
                        backgroundColor: '#ebebeb',
                        color: '#000',
                    });
                }

                aliveSocket.send(JSON.stringify({
                    'type': 'commentvote',
                    'commentPk': commentPk,
                    'ourPk': $('#our_pk').val(),
                }));
            }
        },
        error: () => {
            e.target.disabled = false;
            showAlert();
        },
        beforeSend: () => {
            e.target.disabled = true;
        },
    });
});


// bookmark comment
$(document).on('click', '.bookmark-comment', (e) => {
    let commentPk = $(e.target).data('commentpk');

    $.ajax({
        method: 'POST',
        url: '/bookmark-comment/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            pk: commentPk,
        },
        success: (data) => {
            $(`.bookmark-comment-${commentPk}`).attr('disabled', false);
            showAlert(data.message);
            if (data.status) {
                if (data.bookmarked) {
                    $(`.bookmark-comment-${commentPk}`).addClass('fw-bold');
                } else {
                    $(`.bookmark-comment-${commentPk}`).removeClass('fw-bold');
                }
                aliveSocket.send(JSON.stringify({
                    'type': 'commentbookmark',
                    'commentPk': commentPk,
                    'ourPk': $('#our_pk').val(),
                }));
            }
        },
        error: () => {
            $(`.bookmark-comment-${commentPk}`).attr('disabled', false);
            showAlert();
        },
        beforeSend: () => {
            $(`.bookmark-comment-${commentPk}`).attr('disabled', true);
        },
    });
});

$(document).on('click', '.collapser,.uncollapser', (e) => {
    $(e.target).parent().find('.reply-content').toggleClass('d-none');
    $(e.target).parent().find('.collapser').toggleClass('d-none');
    $(e.target).parent().find('.uncollapser').toggleClass('d-none');
});
$(document).on('click', '.collapser-fluid', (e) => {
    $(e.target).parent().parent().find('.reply-content').toggleClass('d-none');
    $(e.target).parent().parent().find('.collapser').toggleClass('d-none');
    $(e.target).parent().parent().find('.uncollapser').toggleClass('d-none');
});

$(document).on('click', '.replyCommentBtn', (e) => {
    if ($('.comment_reply').html() !== '') {
        $('.comment_comment').html($('.comment_reply').html());
    }
    let markup = $('.comment_comment').html();
    $('.comment_reply').remove();
    $('.comment_comment').html('<button class="n-border-outline w-100">Click to comment on the main thread</button>');
    currentReply = $(e.target).data('reply');
    $(e.target).parent().append(`
        <div class="add_comment comment_reply px-3 py-3 mt-3">
            ${markup}
        </div>
    `);
});

$(document).on('click', '.comment_comment', (e) => {
    if ($('.comment_reply').html() !== '') {
        $('.comment_comment').html($('.comment_reply').html());
        $('.comment_reply').remove();
        currentReply = 0;
    }
});


// hover child affect parent comment
$(document).on('mouseover', '.commentUserNickName', (e) => {
    let id = $(e.target).parents('div.e_comment').data('parentid');
    if (id !== undefined) {
        let a = `#comment-${id}`;
        $(a).css({
            'backgroundColor': '#ffff9d',
        });
    }
});
$(document).on('mouseout', '.commentUserNickName', (e) => {
    let id = $(e.target).parents('div.e_comment').data('parentid');
    if (id !== undefined) {
        let a = `#comment-${id}`;
        $(a).css({
            'backgroundColor': 'initial',
        });
    }
});


// ordering
$(document).on('click', '.comment_filter', (e) => {
    if ($(e.target).data('order') == order) {
        return;
    }
    $('.comment_filter').attr('disabled', true);
    // reset vars, to load comments again
    requesting = false;
    received = 0;
    loadMore = true;

    // empty comments container
    $('#commentsContent').html('');

    let commentContainer = $('#commentsContent');
    let pk = commentContainer.data('postpk');
    order = $(e.target).data('order');
    fetchComment(commentContainer, pk);
    $('.comment_filter').removeClass('active');
    $(e.target).addClass('active');
});