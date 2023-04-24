const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;


const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
});

const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref:'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>`
});

// 문서를 전달하는 쿼리 미들웨어 + 문서를 찾은 후 삭제하는 함수
CampgroundSchema.post('findOneAndDelete', async function(doc) {
    // 삭제된 요소에 접근이 가능하다
    if(doc){
        // 이 문서가 가지고 있는 리뷰 중 리뷰 배열에서 삭제된 ID 필드를 가진 모든 리뷰를 삭제
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }          
});

module.exports = mongoose.model('Campground', CampgroundSchema)
