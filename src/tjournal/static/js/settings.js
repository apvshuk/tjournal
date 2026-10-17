function renderBlacklistUsers(arr) {
    let e = $('.blacklist-user-div');
    e.html('');
    for (let x of arr) {
        e.append(`<span class="badge badge-pill mx-2 my-1" style="background-color: #4683d9;">${x}<button data-value="${x}" type="button" class="btn-close blacklist-remove bg-white px-1 py-1" aria-label="Close" style="font-size: 0.8em;margin-left: 4px;"></button></span>`);
    }
}
function render_hide_posts_with_words(arr) {
    let e = $('.blacklist-words-div');
    e.html('');
    for (let x of arr) {
        e.append(`<span class="badge badge-pill mx-2 my-1" style="background-color: #4683d9;">${x}<button data-value="${x}" type="button" class="btn-close post-blacklist-remove bg-white px-1 py-1" aria-label="Close" style="font-size: 0.8em;margin-left: 4px;"></button></span>`);
    }
}
function renderSocialAcc(arr) {
    let e = $('.social_acc_box');
    e.html('');
    if (arr.length === 0) {
        e.append(`<span>You don't have any social accounts connected</span>`);
        return;
    }
    for (let i of arr) {
        e.append(`<span class="bg-danger badge d-inline-block my-1"><span class="fw-bold">${i.provider} - ${i.name}</span><button type="button" data-id="${i.id}" class="social-one btn-close bg-white px-1 py-1" aria-label="Close" style="font-size: 0.8em;margin-left: 4px;"></button></span>`);
    }
}

$(document).on('click', '#settings_save_change_btn', (e) => {
    let NOTIFICATIONS = {};
    for (let i of $('.notification-inp')) {
        let label = i.dataset['label']
        let l = 'n';
        if (i.classList.toString().includes('notification-mail')) {
            l = 'm';
        }
        if (NOTIFICATIONS[label] === undefined) {
            // add an empty object to populate it
            NOTIFICATIONS[label] = {"label": i.dataset['label_pure']};
        }
        NOTIFICATIONS[label][l] = $(i).is(':checked');
    }
    NOTIFICATIONS = [NOTIFICATIONS];
    let BASIC_SETTINGS = [{
        "show_when_online": $('#settings--show-online').is(':checked'),
        "personal_blog_to_subscribers_only": $('#settings--spbptso').is(':checked'),
        "default_ribbon": $('#settings--default-ribbon option:selected').val(),
    }];

    $.ajax({
        method: 'POST',
        url: '/accounts/settings/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            dta: JSON.stringify({"basic": BASIC_SETTINGS, "notifications": NOTIFICATIONS}),
            nickname: $('#settings--nickname').val(),
            first_name: $('#settings--first-name').val(),
            last_name: $('#settings--last-name').val(),
        },
        success: (data) => {
            $(e.target).attr('disabled', false);
            showAlert(data.message);
            $('.setting_save_alert').remove();
            for (let x of data.alerts) {
                $(x[0]).parent().append(`<span class="text-danger setting_save_alert">${x[1]}</span>`);
            }
        },
        error: () => {
            $(e.target).attr('disabled', false);
            showAlert();
        },
        beforeSend: () => {
            $(e.target).attr('disabled', true);
        }
    });
});


$(document).on('input', '#settings--blacklist-user', debounce(function (e) {
    let query = $('#settings--blacklist-user').val();
    let el = $('.blacklist-user-dropdown').find('.blacklist-user-dropdown-fluid');
    el.html('');
    if (query.trim() == '') {
        el.addClass('d-none');
        return;
    }
    $.ajax({
        method: 'POST',
        url: '/username-suggestion/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            query: query,
        },
        success: (d) => {
            el.removeClass('d-none');
            if (d.s.length == 0) {
                el.append(`
                    <span class="d-block border-bottom px-3 py-2">Could not find someone with this nickname</span>
                `);
            } else {
                for (let i of d.s) {
                    el.append(`
                        <button data-value="${i.username}" class="d-block border-bottom px-3 py-2 username-suggestion n-border-outline text-start w-100" style="cursor: pointer;">${i.first_name} ${i.last_name} ${i.first_name.trim() != '' || i.last_name.trim() != '' ? '-' : ''} ${i.username}</button>
                    `);
                }
            }
        }
    });
}, 250));


$(document).on('click', '.username-suggestion', (e) => {
    let u = e.target.dataset['value'];
    let el = $('.blacklist-user-dropdown').find('.blacklist-user-dropdown-fluid');
    el.html('');
    el.addClass('d-none');
    $('#settings--blacklist-user').val('');
    e.target.disabled = true;
    $.ajax({
        method: 'POST',
        url: '/add-blacklist-user/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            u: u,
        },
        success: (data) => {
            renderBlacklistUsers(data.usernames);
            for (let i of data.alerts) {
                showAlert(i, 5000)
            }
            $(function(){
                $('#settings--blacklist-user').focus();
            });
        },
        error: () => {
            showAlert();
            $(function(){
                $('#settings--blacklist-user').focus();
            });
        }
    });
});
$(document).on('keypress', '#settings--blacklist-post', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
        let u = $('#settings--blacklist-post').val();
        $('#settings--blacklist-post').val('');
        e.target.disabled = true;
        $.ajax({
            method: 'POST',
            url: '/hide_posts_with_words/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                u: u,
            },
            success: (data) => {
                render_hide_posts_with_words(data.posts_with_words);
                for (let i of data.alerts) {
                    showAlert(i, 5000)
                }
                e.target.disabled = false;
                $(function(){
                    $('#settings--blacklist-post').focus();
                });
            },
            error: () => {
                showAlert();
                e.target.disabled = false;
                $(function(){
                    $('#settings--blacklist-post').focus();
                });
            },
        });
    }
});

function loadBlacklists(e) {
    $.ajax({
        method: 'POST',
        url: '/add-blacklist-user/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        },
        success: (data) => {
            renderBlacklistUsers(data.usernames);
        },
        error: () => {
            let e = $('.blacklist-user-div');
            e.html(`
                <small>Could not load blacklisted users</small>
                <button id="retry-blacklist-load" class="btn-small transp-btn bg-white px-1 py-0 btn-bx-s">Retry</button>
            `);
        }
    });
}
function load_posts_with_words(e) {
    $.ajax({
        method: 'POST',
        url: '/hide_posts_with_words/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
        },
        success: (data) => {
            render_hide_posts_with_words(data.posts_with_words);
        },
        error: () => {
            let e = $('.blacklist-user-div');
            e.html(`
                <small>Could not load blacklisted words</small>
                <button id="retry-blacklist-load" class="btn-small transp-btn bg-white px-1 py-0 btn-bx-s">Retry</button>
            `);
        }
    });
}
$(document).ready((e) => {loadBlacklists(e)});
$(document).ready((e) => {load_posts_with_words(e)});
$(document).on('click', '#retry-blacklist-load', (e) => {loadBlacklists(e)});


$(document).on('click', '.blacklist-remove', (e) => {
    e.target.disabled = true;
    $.ajax({
        method: 'POST',
        url: '/remove-blacklist-user/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            u: e.target.dataset['value'],
        },
        success: (data) => {
            renderBlacklistUsers(data.usernames);
        },
        error: () => {
            e.target.disabled = false;
        },
    });
});
$(document).on('click', '.post-blacklist-remove', (e) => {
    e.target.disabled = true;
    $.ajax({
        method: 'POST',
        url: '/remove_blacklist_words/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            u: e.target.dataset['value'],
        },
        success: (data) => {
            render_hide_posts_with_words(data.posts_with_words);
        },
        error: () => {
            e.target.disabled = false;
        },
    });
});

$(document).on('click', '.social-one', (e) => {
    askUser('Remove Social Account?', 'Are you sure you want to remove this social account?', (status) => {
        if (status) {
            $.ajax({
                method: 'POST',
                url: '/accounts/social/connections/',
                data: {
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                    account: e.target.dataset['id'],
                },
                success: (data) => {
                    renderSocialAcc(data.data.socialaccounts);
                },
                error: (error) => {
                    e.target.disabled = false;
                    for (let i of error.responseJSON.form.errors) {
                        showAlert(i);
                    }
                },
                beforeSend: () => {
                    e.target.disabled = true;
                }
            });
        }
    })
});