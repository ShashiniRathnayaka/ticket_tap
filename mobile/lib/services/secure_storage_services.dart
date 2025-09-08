import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  
  // Keys for stored data
  static const String _keyUserId = 'user_id';
  static const String _keyUserEmail = 'user_email';
  static const String _keyUserName = 'user_name';
  static const String _keyUserRole = 'user_role';
  static const String _keyAuthToken = 'auth_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyIsLoggedIn = 'is_logged_in';

  // Save user data after sign-up/sign-in (static method)
  static Future<void> saveUserData({
    required String userId,
    required String email,
    required String name,
    required String role,
    required String authToken,
    String? refreshToken,
  }) async {
    try {
      // Save sensitive data to secure storage
      await _secureStorage.write(key: _keyUserId, value: userId);
      await _secureStorage.write(key: _keyUserEmail, value: email);
      await _secureStorage.write(key: _keyUserName, value: name);
      await _secureStorage.write(key: _keyUserRole, value: role);
      await _secureStorage.write(key: _keyAuthToken, value: authToken);
      
      if (refreshToken != null) {
        await _secureStorage.write(key: _keyRefreshToken, value: refreshToken);
      }

      // Save login state to shared preferences (non-sensitive)
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyIsLoggedIn, true);
      
      print('User data saved successfully');
    } catch (e) {
      print('Error saving user data: $e');
      throw Exception('Failed to save user data');
    }
  }

  // Other static methods...
  static Future<Map<String, String?>> getUserData() async {
    try {
      final Map<String, String> allValues = await _secureStorage.readAll();
      
      return {
        'userId': allValues[_keyUserId],
        'email': allValues[_keyUserEmail],
        'name': allValues[_keyUserName],
        'role': allValues[_keyUserRole],
        'authToken': allValues[_keyAuthToken],
        'refreshToken': allValues[_keyRefreshToken],
      };
    } catch (e) {
      print('Error retrieving user data: $e');
      return {};
    }
  }

    static Future<void> clearAll() async {
    try {
      await _secureStorage.deleteAll();

      // Also reset login state in shared preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyIsLoggedIn, false);

      print('User data cleared successfully');
    } catch (e) {
      print('Error clearing user data: $e');
    }
  }


  // Add other static methods as needed...
}