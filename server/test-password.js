import passwordService from './src/services/passwordService.js';

async function testPassword() {
    const plainPassword = 'Admin123!';
    
    console.log('Testing password hashing and verification...');
    console.log('Plain password:', plainPassword);
    
    try {
        // Hash the password
        const hashedPassword = await passwordService.hashPassword(plainPassword);
        console.log('Hashed password:', hashedPassword);
        
        // Verify the password
        const isValid = await passwordService.verifyPassword(plainPassword, hashedPassword);
        console.log('Verification result:', isValid);
        
        // Test with wrong password
        const isInvalid = await passwordService.verifyPassword('WrongPassword', hashedPassword);
        console.log('Wrong password verification:', isInvalid);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testPassword();