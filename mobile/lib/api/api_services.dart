// api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _baseUrl = 'http://192.168.8.117:5000';
  
  static Future<Map<String, dynamic>> createPaymentIntent(Map<String, dynamic> paymentData) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/payment/create-payment-intent'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(paymentData),
    );
    print('response of payment intent create: ${response.body}');
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create payment intent: ${response.statusCode}');
    }
  }
  
  static Future<Map<String, dynamic>> confirmPayment(Map<String, dynamic> confirmationData) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/payment/confirm-payment'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(confirmationData),
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to confirm payment: ${response.statusCode}');
    }
  }
}