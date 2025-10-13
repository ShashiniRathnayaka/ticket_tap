import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:ticket_tap/services/secure_storage_services.dart';
import 'package:ticket_tap/views/sign_in.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userId = '';
  String _email = '';
  String _name = '';
  String _role = '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final userData = await SecureStorageService.getUserData();

    setState(() {
      _userId = userData['userId'] ?? '';
      _email = userData['email'] ?? '';
      _name = userData['name'] ?? '';
      _role = userData['role'] ?? '';
    });
  }

  Future<void> _logout(BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(
            'logout'.tr(),
            style: TextStyle(color: Color(0xFF4E1A93)),
          ),
          content: Text('logout_confirmation'.tr()),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('cancel'.tr()),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await SecureStorageService.clearAll();
                if (!mounted) return;
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const SignIn()),
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: Text('logout'.tr()),
            ),
          ],
        );
      },
    );
  }

Future<void> _changeLanguage(BuildContext context, String languageCode) async {
  try {
    Locale newLocale;
    
    // Create locale with country code based on language
    switch (languageCode) {
      case 'si':
        newLocale = const Locale('si', 'LK'); // Sinhala - Sri Lanka
        break;
      case 'ta':
        newLocale = const Locale('ta', 'IN'); // Tamil - Sri Lanka
        break;
      case 'en':
      default:
        newLocale = const Locale('en', 'US'); // English - USA
        break;
    }
    
    await context.setLocale(newLocale);
    
    // Force rebuild
    if (mounted) {
      setState(() {});
    }
  } catch (e) {
    print('Error changing language: $e');
  }
}

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(
            'select_language'.tr(),
            style: TextStyle(color: Color(0xFF4E1A93)),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildLanguageOption(
                context,
                'English',
                'en',
                Icons.language,
                Colors.blue,
              ),
              _buildLanguageOption(
                context,
                'සිංහල',
                'si',
                Icons.translate,
                Colors.green,
              ),
              _buildLanguageOption(
                context,
                'தமிழ்',
                'ta',
                Icons.language,
                Colors.orange,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('cancel'.tr()),
            ),
          ],
        );
      },
    );
  }

  Widget _buildLanguageOption(
    BuildContext context,
    String languageName,
    String languageCode,
    IconData icon,
    Color color,
  ) {
    final isCurrentLanguage = context.locale.languageCode == languageCode;
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isCurrentLanguage ? Color(0xFF4E1A93) : Colors.transparent,
          width: 2,
        ),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(
          languageName,
          style: TextStyle(
            fontWeight: FontWeight.w500,
            color: isCurrentLanguage ? Color(0xFF4E1A93) : Colors.black87,
          ),
        ),
        trailing: isCurrentLanguage
            ? Icon(Icons.check_circle, color: Color(0xFF4E1A93))
            : null,
        onTap: () {
          _changeLanguage(context, languageCode);
          Navigator.of(context).pop();
        },
      ),
    );
  }

  Widget _buildInfoTile(String title, String value, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF4E1A93).withOpacity(0.1)),
        ),
        child: ListTile(
          leading: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          title: Text(
            title.tr(), // Added .tr() here
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          subtitle: Text(
            value.isNotEmpty ? value : "not_available".tr(), // Added .tr() here
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Color(0xFF4E1A93),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isLoading = _email.isEmpty && _name.isEmpty;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text(
          "profile".tr(),
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4E1A93),
        elevation: 0,
        actions: [
          // Language switcher icon
          IconButton(
            icon: const Icon(Icons.language, color: Colors.white),
            onPressed: () => _showLanguageDialog(context),
            tooltip: 'select_language'.tr(),
          ),
          // Logout icon
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () => _logout(context),
            tooltip: 'logout'.tr(),
          ),
        ],
      ),
      body: isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4E1A93)),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'loading_profile'.tr(),
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  // Profile header with gradient
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          const Color(0xFF4E1A93).withOpacity(0.9),
                          const Color(0xFF6B46C1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.purple.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: Text(
                            _name.isNotEmpty ? _name[0].toUpperCase() : "?",
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _name.isNotEmpty ? _name : "no_name".tr(), // Added .tr()
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _role.isNotEmpty ? _role.toUpperCase() : "user_role".tr().toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _email.isNotEmpty ? _email : "no_email".tr(), // Added .tr()
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),

                  // Language Change Card
                  Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    elevation: 3,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF4E1A93).withOpacity(0.1)),
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: Colors.purple.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.language, color: Colors.purple, size: 24),
                        ),
                        title: Text(
                          'select_language'.tr(),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: Color(0xFF4E1A93),
                          ),
                        ),
                        subtitle: Text(
                          'Change app language'.tr(), // You can add this to your JSON files
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        trailing: Icon(Icons.arrow_forward_ios, color: Color(0xFF4E1A93), size: 16),
                        onTap: () => _showLanguageDialog(context),
                      ),
                    ),
                  ),

                  // Personal Information Section
                  Row(
                    children: [
                      Icon(Icons.person_outline, color: Color(0xFF4E1A93)),
                      SizedBox(width: 8),
                      Text(
                        'personal_information'.tr(),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF4E1A93),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  _buildInfoTile(
                    "user_id".tr(), // Added .tr()
                    _userId, 
                    Icons.fingerprint, 
                    Colors.blue.shade600
                  ),
                  
                  _buildInfoTile(
                    "email_address".tr(), // Added .tr()
                    _email, 
                    Icons.email, 
                    Colors.green.shade600
                  ),
                  
                  _buildInfoTile(
                    "account_role".tr(), 
                    _role, 
                    Icons.badge, 
                    Colors.orange.shade600
                  ),

                  const SizedBox(height: 30),

                  // Action Buttons
                  Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('edit_profile_coming_soon'.tr()), // Added .tr()
                                backgroundColor: const Color(0xFF4E1A93),
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4E1A93),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(Icons.edit, size: 20),
                          label: Text(
                            'edit_profile'.tr(),
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 12),
                      
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('change_password_coming_soon'.tr()), // Added .tr()
                                backgroundColor: Colors.blue.shade600,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF4E1A93),
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            side: const BorderSide(color: Color(0xFF4E1A93)),
                          ),
                          icon: const Icon(Icons.lock, size: 20),
                          label: Text(
                            'change_password'.tr(),
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}