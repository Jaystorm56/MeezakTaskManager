import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import companyLogo from '../assets/images/company-logo.png';
import emailIcon from '../assets/icons/dashicons_email.png';
import pwdIcon from '../assets/icons/mdi_password.png';
import showPwd from '../assets/icons/seepwd.png';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error.message);
      alert(error.message);
    }
  };

  return (
    <div  className='relative' style={{border:"solid red 1px" }}>
      <div className='w-[1318px] h-[75px] border-b-[0.5px] border-b-[#66666666] flex justify-between py-[10px] absolute top-[16px] left-[60px]'>

        <img src={companyLogo} alt="Meezak-Company-Logo" className="block w-[120px] h-[43px]" />

        <div className='w-[90px] h-[18px]'>
          <p className='font-bold text-[14px] leading-[100%] tracking-[0] text-[#333333]'>Need Help?</p>
        </div>

      </div>

      <div className='absolute top-[209px] left-[480px] w-[480px] h-[480px]'>
          
          <h2 className='text-[#333333] w-[245px] h-[30px] text-[24px] font-bold uppercase leading-[100%] tracking-[0] m-auto'>Employee's Login
          </h2>

          <form  onSubmit={handleLogin} className='w-full h-fit'>

           
            <div className='w-full h-[56px] rounded-[10px] border border-[#DAE0E6] gap-[12px] bg-[#F8F8F8] px-[20px] flex justify-between items-center my-[14px]'>
              <img src={emailIcon} alt="face-icon" className="w-[20px] h-[20px] top-[3px] left-[3px]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className='hover:border-none hover:outline-none focus:border-none focus:outline-none w-[410px] h-[40px] text-[#33333380] bg-[#F8F8F8] font-[Outfit] font-normal text-[14px] leading-[24px] tracking-[-0.1px] align-middle'
              />
            </div>

            <div className='w-full h-[56px] rounded-[10px] border border-[#DAE0E6] gap-[12px] bg-[#F8F8F8] px-[20px] flex justify-between items-center my-[14px]'>
              <img src={pwdIcon} alt="face-icon" className="w-[20px] h-[20px] top-[3px] left-[3px]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className='hover:border-none hover:outline-none focus:border-none focus:outline-none w-[378px] h-[40px] text-[#33333380] bg-[#F8F8F8] font-[Outfit] font-normal text-[14px] leading-[24px] tracking-[-0.1px] align-middle'
              />
              <img src={showPwd} alt="face-icon" className="w-[20px] h-[20px]" />
            </div>
            
            <div className='w-full h-[56px] rounded-[10px] border border-[#DAE0E6] gap-[12px] bg-[#F8F8F8] flex justify-between items-center mt-[32px] mb-[20px]'>
              <button type="submit" className='w-full h-[56px] rounded-[10px] text-[#ffffff] bg-[#666666]'>Login</button>
            </div>

          </form>
          
            <Link to="/signup" className="block w-fit h-[18px] mx-auto font-normal text-[14px] leading-[100%] tracking-[0%]">
             Don't have an account? <span className='font-bold'>Sign Up</span> 
            </Link>
        
      </div>
    </div>
  );
}

export default SignIn;
