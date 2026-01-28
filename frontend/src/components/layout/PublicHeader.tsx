import { Link } from 'react-router-dom';
import logo from '../../assets/leadlab-logo.png';

export function PublicHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 mx-auto">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <img className="h-12 w-auto" src={logo} alt="Logo" />
          </Link>
        </div>
      </div>
    </header>
  );
}
