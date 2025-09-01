import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

final storage = FlutterSecureStorage();

// Function to save tokens
Future<void> saveTokens(String accessToken, String refreshToken) async {
  await storage.write(key: 'accessToken', value: accessToken);
  await storage.write(key: 'refreshToken', value: refreshToken);
}

// Function to read tokens
Future<Map<String, String?>> readTokens() async {
  String? accessToken = await storage.read(key: 'accessToken');
  String? refreshToken = await storage.read(key: 'refreshToken');
  return {
    'accessToken': accessToken,
    'refreshToken': refreshToken,
  };
}

// Function to delete tokens
Future<void> deleteTokens() async {
  await storage.delete(key: 'accessToken');
  await storage.delete(key: 'refreshToken');
}

// Function to save user details
Future<void> saveUserDetails(int id, String name, String email, String role) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt('id', id);
  await prefs.setString('name', name);
  await prefs.setString('email', email);
  await prefs.setString('role', role);
}

// Function to read user details
Future<Map<String, dynamic>> readUserDetails() async {
  final prefs = await SharedPreferences.getInstance();
  int? id = prefs.getInt('id');
  String? name = prefs.getString('name');
  String? email = prefs.getString('email');
  String? role = prefs.getString('role');

  return {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
  };
}

// Function to delete user details
Future<void> deleteUserDetails() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('id');
  await prefs.remove('name');
  await prefs.remove('email');
  await prefs.remove('role');
}