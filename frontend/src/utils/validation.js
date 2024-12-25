// 如果还是找不到validator模块，我们可以直接实现验证逻辑
export const validateRegistration = (data) => {
    const errors = {};

    // 验证用户名
    if (!data.username || data.username.length < 3 || data.username.length > 30) {
        errors.username = '用户名长度必须在3-30个字符之间';
    }

    // 验证密码
    if (!data.password || data.password.length < 6) {
        errors.password = '密码长度至少为6个字符';
    }

    // 验证密码确认
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}; 