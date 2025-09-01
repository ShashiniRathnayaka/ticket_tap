import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:ticket_tap/api/saveto_storage.dart';
import 'package:ticket_tap/constants/api_constants.dart';

Future<dynamic> signUp(String name, String email, String password, String role,) async {
  final dio = Dio();

  try {
    final response = await dio.post(
      'http://192.168.8.117:5000/auth/signup', // Replace with your endpoint
      data: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      }),
      options: Options(
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      print('User Created successfully: ${response.data}');
      saveTokens(response.data['accessToken'], response.data['refreshToken']);
      saveUserDetails(
        response.data['user']['id'],
        response.data['user']['name'],
        response.data['user']['email'],
        response.data['user']['role'],
      );
      return response.data;
    } else if (response.statusCode == 409) {
      final data = response.data;
      print("Conflict: ${data['message']}"); // This will be 'Email is already registered'
      return data['message'];
    }else {
      print('Failed create user: ${response.statusCode}');
    }
  } catch (e) {
    if (e is DioException) {
    print('Dio error: ${e.response?.statusCode} ${e.response?.data}');
    return e.response?.data?['message'] ?? 'An unexpected error occurred';
  } else {
    print('Error creating user: $e');
    return 'An unexpected error occurred';
  }
  }
}
