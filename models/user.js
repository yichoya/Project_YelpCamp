const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLacalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true    // 유효성 검사에 동원되는 값은 아님
    }
});

// 패키지를 불러온 결과를 UserSchema.plugin에 전달
// -> 스키마에 사용자 이름과 암호필드를 추가, 사용자 이름 중복여부 확인, 스키마에 부가 메서드 추가
// (따라서 스키마를 선언할 때 사용자 이름 변수를 미리 넣지 않아도 됨)
UserSchema.plugin(passportLacalMongoose);

module.exports = mongoose.model('User', UserSchema);