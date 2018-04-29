"""
Flask Documentation:     http://flask.pocoo.org/docs/
Jinja2 Documentation:    http://jinja.pocoo.org/2/documentation/
Werkzeug Documentation:  http://werkzeug.pocoo.org/documentation/
"""
from app import app, db, login_manager, csrf
from flask import render_template, request, session, jsonify, g,url_for, redirect
from controllers import form_errors
from flask_login import login_user, logout_user, current_user, login_required
from forms import LoginF, RegisterF, PostF
from models import Users, Posts, Follows, Likes
from werkzeug.utils import secure_filename
from werkzeug.datastructures import CombinedMultiDict
from functools import wraps
import jwt, os, datetime

def requires_auth(f):
  @wraps(f)
  def decorated(*args, **kwargs):
    auth = request.headers.get('Authorization', None)
    if not auth:
      return jsonify({'code': 'authorization_header_missing', 'description': 'Authorization header is expected'}), 401

    parts = auth.split()

    if parts[0].lower() != 'bearer':
      return jsonify({'code': 'invalid_header', 'description': 'Authorization header must start with Bearer'}), 401
    elif len(parts) == 1:
      return jsonify({'code': 'invalid_header', 'description': 'Token not found'}), 401
    elif len(parts) > 2:
      return jsonify({'code': 'invalid_header', 'description': 'Authorization header must be Bearer + \s + token'}), 401

    token = parts[1]
    try:
         payload = jwt.decode(token, csrf)
         get_user = Users.query.filter_by(id=payload['user_id']).first()

    except jwt.ExpiredSignature:
        return jsonify({'code': 'token_expired', 'description': 'token is expired'}), 401
    except jwt.DecodeError:
        return jsonify({'code': 'token_invalid_signature', 'description': 'Token signature is invalid'}), 401

    g.current_user = user = get_user
    return f(*args, **kwargs)

  return decorated


@app.route('/')
def index():
    """Render website's initial page and let VueJS take over."""
    return render_template('index.html')

@app.route('/api/users/register', methods = ['POST'])
def register():
    error=None
    form = RegisterF()
    if request.method == 'POST' and form.validate_on_submit():
        username = request.username.data
        password = request.password.data
        firstname = request.firstname.data
        lastname = request.lastname.data
        email = request.email.data
        location = request.location.data
        if not Users.query.filter_by(email = email).first() and not Users.query.filter_by(username = username).first():
            users = users(user_name = username, first_name = first_name, last_name = last_name, email = email, plain_password = password,location=location)
            db.session.add(users)
            db.session.commit()
            #flash success message
            return url_for('login')
        else:
            error = "Email and/or username already exists"
            return jsonify({'errors': error})
    else:
        return jsonify({'errors':form_errors(form)})


@app.route('/api/auth/login', methods = ['POST'])
def userLogin():
    if current_user.is_authenticated:
        return jsonify(errors=[{'message': 'User already logged in'}])
    form = LoginF()
    if request.method == 'POST' and form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        user=Users.query.filter_by(username=username,password=password).first()
        if user is not None:
            login_user(user)
            payload = {'user_id' : user.id}
            token = jwt.encode(payload, csrf)
            return jsonify(response = [{'message': 'You have successfully logged in', 'token': token, 'userid': user.id, 'photo':'/static/uploads/'+user.profile_photo}])
        else:
            return jsonify(errors= [{'error':['Username or password is incorrect']}])
    return jsonify(errors= [{'error':form_errors(form)}])


@app.route('/api/auth/logout', methods = ['GET'])
@login_required
@requires_auth
def userLogout():
    g.current_user = None
    logout_user()
    return jsonify(response=[{'message': 'You have successfully logged out'}])
    
@login_manager.user_loader
def load_user(id):
    return Users.query.get(int(id))

@app.route('/api/users/<int:user_id>/follow', methods = ['POST'])
@requires_auth
def userFollow(user_id):
    if request.method == 'POST':
        userfollow=Follows(user_id,current_user.id)
        db.session.add(userfollow)
        db.session.commit()
        user=Users.query.filter_by(id=user_id).first()
        return jsonify(response = [{'message':'Now following'+user.username}])


# @app.route('/api/posts/<int:post_id>/like', methods =['POST'])
# @requires_auth
# def userLike(post_id):
#     if request.method == 'POST':
#         userlike=Likes(post_id,current_user.id)
#         db.session.add(userlike)
#         db.session.commit()
#         # add count function
#         def countlikes(post_id):
#             count=Likes.query.filter_by(post_id=post_id).all()
#             return len(count)
#         return jsonify(response= [{'message':'Liked','Likes':count}])

# @app.route('/api/auth/login', methods = ['POST'])
# def login():
#     error=None
#     form = LoginF()
#     if request.method == 'POST' and form.validate_on_submit():
#         username = form.username.data
#         password = form.password.data
#         user = Users.query.filter_by(username = username).first()
#         if user and user.is_correct_password(password): 
#             login_user(user)
#             next_page = request.args.get('next')
#             return redirect(next_page or url_for('dashboard'))
#         else: 
#             error = "Invalid email and/or password"
#             return jsonify({'errors': error})
#     else:
#         return jsonify({'errors':form_errors(form)})

@app.route('/api/auth/login',methods=["POST"])
def login():
    form = LoginF()
    
    if request.method == "POST" and form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        
        user = Users.query.filter_by(username=username).first()
        
        if user != None and check_password_hash(user.password, password):
            payload = {'user': user.username}
            jwt_token = jwt.encode(payload,app.config['SECRET_KEY'],algorithm = "HS256")
            response = {'message': 'User successfully logged in','token':jwt_token, "user_id": user.id}
            
            return jsonify(response)
            
        return jsonify(errors="Username or password is incorrect")
    
    return jsonify(errors=form_errors(form))


@app.route('/api/auth/logout', methods = ['GET'])

def logout():
    return jsonify(message= "User successfully logged out.")

"""



@app.route('/api/users/<user_id>/posts', methods = ['POST','GET'])
@requires_auth
def addPost():
    form = PostF()
    # if request.method == 'GET':
    #     posts=Posts.query.filter_by(user_id=user_id).all()
    #     return jsonify({ #add array function})
        
    if request.method =='POST' and form.validate_on_submit():
        photo = form.photo.data
        caption = form.caption.data 
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(filefolder,filename))
        postcreate = datetime.datetime.now()
        post = Posts(current_user.id,filename,caption,postcreate)
        db.session.add(posts)
        db.session.commit()
        return jsonify(response=[{'message': 'Successfully added!'}])
    return jsonify(errors=[{'error':form_errors(form)}])


@app.route('/api/posts', methods = ['GET'])
def allPosts():
    posts = Posts.query.order_by(Posts.created_on).all()
    #return jsonify({'posts': add array function})

"""

@app.route('/api/users/<user_id>/posts', methods =['GET','POST'])

def posts(user_id):
    
    if request.method == 'GET':
        posts = Posts.query.filter_by(user_id = user_id).all()
        
        user = Users.query.filter_by(id=user_id).first()
        user_follower_count = len(Follows.query.filter_by(user_id=user.id).all())
        response = {"status": "ok", "post_data":{"firstname":user.first_name, "lastname": user.last_name, "location": user.location, "joined_on": "Member since "+strf_time(user.joined_on, "%B %Y"), "bio": user.biography, "postCount": len(posts), "followers": user_follower_count, "profile_image": os.path.join(app.config['PROFILE_IMG_UPLOAD_FOLDER'],user.profile_photo), "posts":[]}}
        
        for post in posts:
            postObj = {"id":post.id, "user_id": post.user_id, "photo": os.path.join(app.config['POST_IMG_UPLOAD_FOLDER'], post.photo), "caption": post.caption, "created_on": post.created_on}
            response["post_data"]["posts"].append(postObj)
        
        return jsonify(response)
    
    
    if request.method == 'POST':
        
        form = PostF()
        
        if form.validate_on_submit():
            
            u_id = form.user_id.data
            photo = form.photo.data
            captn = form.caption.data
            
            user = Users.query.filter_by(id=u_id).first()
            
            filename = user.username+secure_filename(photo.filename)
            
            create_date = str(datetime.date.today())
            post = Posts(user_id=u_id,photo=filename,caption=captn ,created_on=create_date)
            photo.save(os.path.join("./app", app.config['POST_IMG_UPLOAD_FOLDER'],filename))
            db.session.add(post)
            db.session.commit()
            return jsonify(status=201, message="Post Created")
            
            
        print form.errors.items()
        return jsonify(status=200, errors=form_errors(form))
        
@app.route('/api/posts', methods = ['GET'])

def viewPosts():
    allPosts = Posts.query.all()
    posts = []
    
    
    for post in allPosts:
        user = Users.query.filter_by(id=post.user_id).first()

        likeCount = len(Likes.query.filter_by(post_id=post.id).all())
        postObj = {"id": post.id, "user_id": post.user_id, "username": user.username, "user_profile_photo": os.path.join(app.config['PROFILE_IMG_UPLOAD_FOLDER'],user.profile_photo),"photo": os.path.join(app.config['POST_IMG_UPLOAD_FOLDER'],post.photo), "caption": post.caption, "created_on": strf_time(post.created_on, "%d %B %Y"), "likes": likeCount}
        posts.append(postObj)
        
    return jsonify(posts=posts)

def strf_time(date, dateFormat):
    return datetime.date(int(date.split('-')[0]),int(date.split('-')[1]),int(date.split('-')[2])).strftime(dateFormat)

@app.route('/<file_name>.txt')
def send_text_file(file_name):
    """Send your static text file."""
    file_dot_text = file_name + '.txt'
    return app.send_static_file(file_dot_text)


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also tell the browser not to cache the rendered page. If we wanted
    to we could change max-age to 600 seconds which would be 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response


@app.errorhandler(404)
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port="8080")
