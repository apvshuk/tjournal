let mailLogin = '';
let oAuthLogin = '';

function populateLoginVar(login_type, success_func) {
    if ((login_type == 'mail' && mailLogin != '') || (login_type == 'oauth' && oAuthLogin != '')) {
        success_func();
        return;
    }
    $.ajax({
        url: '/login-as-string/',
        method: 'POST',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            login_type: login_type,
        },
        success: (data) => {
            if (login_type == 'mail') {mailLogin = data.template_as_string}
            if (login_type == 'oauth') {oAuthLogin = data.template_as_string}
            success_func();
        },
        error: () => {
            $('.login__right__options').html(`
                <div style="display: flex;align-items:center;justify-content:center;">
                    <button class="transp-btn bg-white btn-bx-s" id="${login_type}_load_retry">Retry</button>
                </div>
            `);
        },
        beforeSend: () => {
            $('.login__right__options').html(`
                <div style="display: flex;align-items:center;justify-content:center;">
                    <span class="spinner-border d-block mt-5 spinner-border-sm" role="status" aria-hidden="true" style="width: 5rem; height: 5rem;"></span>
                </div>
            `);
        },
    });
}

function showOauthLogin() {
    populateLoginVar('oauth', () => {
        $('.login__right__options').html(oAuthLogin);
        $('.back_to_login_options').addClass('d-none');
    });
}
function showMailLogin() {
    populateLoginVar('mail', () => {
        $('.login__right__options').html(mailLogin);
        $('.back_to_login_options').removeClass('d-none');
    });
}

$(document).on('click', '.show_login_mail', (e) => {
    showMailLogin();
});

$(document).on('click', '.show_login_options', (e) => {
    showOauthLogin();
});

$(document).on('submit', '#mail_signin_form', (e) => {
    e.preventDefault();
    $.ajax({
        url: '/accounts/login/',
        method: 'POST',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            login: $('#id_login').val(),
            password: $('#id_password').val(),
        },
        dataType: 'json',
        success: () => {
            let next_ = new URL(window.location).searchParams.get('next');
            if (next_ != undefined) {
                window.location = next_;
            } else {
                window.location = '/';
            }
        },
        error: (data) => {
            showAlert(data.responseJSON.form.errors[0]);
            for (let i = 0, len = e.target.elements.length; i < len; ++i) {
                e.target.elements[i].disabled = false;
            }
            $('#to_comein_loader').remove();
        },
        beforeSend: () => {
            for (var i = 0, len = e.target.elements.length; i < len; ++i) {
                e.target.elements[i].disabled = true;
            }
            $(e.target).find('button[type=submit]').html(`To come in <i id="to_comein_loader" class="fas fa-circle-notch fa-spin"></i>`);
        },
    });
});


$(document).on('click', '#mail_load_retry', (e) => {
    showMailLogin();
});

$(document).on('click', '#oauth_load_retry', (e) => {
    showOauthLogin();
});