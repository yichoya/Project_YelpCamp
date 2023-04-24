const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res, next) => {
    // 원래 코드
    // req.logout();
    // req.flash('success', 'Goodbye!');
    // res.redirect('/campgrounds');
    
    // passport 버전이 업그레이드되면서 logout 메서드가 비동기함수로 바뀜
    // 따라서 해당 메서드에 콜백함수를 추가해야함
    req.logout(err => {
        if(err) { return next(err);}
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}
