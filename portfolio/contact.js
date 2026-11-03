(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var rules = {
    name: function (v) { return v ? '' : 'Please enter your name.'; },
    email: function (v) {
      if (!v) return 'Please enter your email.';
      return emailRe.test(v) ? '' : 'Please enter a valid email address.';
    },
    message: function (v) {
      if (!v) return 'Please write a message.';
      return v.length < 10 ? 'Please add a little more detail (10+ characters).' : '';
    }
  };

  function check(name) {
    var input = form.elements[name];
    var msg = rules[name](input.value.trim());
    document.getElementById(name + '-error').textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    form.elements[name].addEventListener('blur', function (e) {
      // Skip when focus moves to Submit: inserting an error here would shift the
      // button out from under the pointer. Submit validates everything anyway.
      if (e.relatedTarget !== button) check(name);
    });
    form.elements[name].addEventListener('input', function () {
      if (this.getAttribute('aria-invalid') === 'true') check(name);
    });
  });

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'status' + (kind ? ' ' + kind : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var invalid = Object.keys(rules).filter(function (n) { return !check(n); });
    if (invalid.length) {
      form.elements[invalid[0]].focus();
      setStatus('Please fix the highlighted fields.', 'bad');
      return;
    }
    if (form.elements.company.value) return; // honeypot: likely a bot

    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim()
    };
    var endpoint = form.dataset.endpoint;

    if (!endpoint) {
      var subject = data.subject || 'Message from ' + data.name;
      var body = data.message + '\n\n— ' + data.name + ' (' + data.email + ')';
      window.location.href = 'mailto:' + form.dataset.email +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      setStatus('Your email app should open with the message ready to send.', 'ok');
      return;
    }

    button.disabled = true;
    setStatus('Sending…');
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      setStatus("Thanks — your message is on its way. I'll be in touch soon.", 'ok');
    }).catch(function () {
      setStatus('Something went wrong sending your message. Please try again, or email ' + form.dataset.email + '.', 'bad');
    }).then(function () {
      button.disabled = false;
    });
  });
})();
